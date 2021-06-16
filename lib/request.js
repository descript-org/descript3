const http_ = require( 'http' );
const https_ = require( 'https' );
const qs_ = require( 'querystring' );
const url_ = require( 'url' );
const zlib_ = require( 'zlib' );

const Logger = require( './logger' );

const get_deferred = require( './get_deferred' );
const { create_error, ERROR_ID } = require( './error' );
const is_plain_object = require( './is_plain_object' );

const extend = require( './extend' );

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: А зачем тут WeakMap, а не просто Map?
//
const agents_cache_http = new WeakMap();
const agents_cache_https = new WeakMap();

const RX_IS_JSON = /^application\/json(?:;|\s|$)/;

const DEFAULT_OPTIONS = {
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    pathname: '/',

    is_error: function( error, request_options ) {
        const id = error.error.id;
        const status_code = error.error.status_code;

        return (
            id === ERROR_ID.TCP_CONNECTION_TIMEOUT ||
            id === ERROR_ID.REQUEST_TIMEOUT ||
            status_code >= 400
        );
    },

    is_retry_allowed: function( error, request_options ) {
        const method = request_options.http_options.method;
        if ( method === 'POST' || method === 'PATCH' ) {
            return false;
        }

        const id = error.error.id;
        const status_code = error.error.status_code;

        return (
            id === ERROR_ID.TCP_CONNECTION_TIMEOUT ||
            id === ERROR_ID.REQUEST_TIMEOUT ||
            status_code === 408 ||
            status_code === 429 ||
            status_code === 500 ||
            ( status_code >= 502 && status_code <= 504 )
        );
    },

    max_retries: 0,

    retry_timeout: 100,
};

//  ---------------------------------------------------------------------------------------------------------------  //

class RequestOptions {

    constructor( options ) {
        //  NOTE: Тут не годится Object.assign, так как ключи с undefined перезатирают все.
        options = extend( {}, DEFAULT_OPTIONS, options );

        this.is_error = options.is_error;
        this.is_retry_allowed = options.is_retry_allowed;
        this.max_retries = options.max_retries;
        this.retry_timeout = options.retry_timeout;

        this.retries = 0;

        this.timeout = options.timeout;

        this.http_options = {};

        this.http_options.protocol = options.protocol;
        this.http_options.hostname = options.hostname;
        this.http_options.port = options.port;
        if ( options.family ) {
            this.http_options.family = options.family;
        }
        if ( !this.http_options.port ) {
            this.http_options.port = ( this.http_options.protocol === 'https:' ) ? 443 : 80;
        }

        let pathname = options.pathname;
        if ( pathname.charAt( 0 ) !== '/' ) {
            pathname = '/' + pathname;
        }

        this.http_options.path = url_.format( {
            pathname: pathname,
            query: options.query,
        } );

        if ( options.auth ) {
            this.http_options.auth = options.auth;
        }

        //  Нужно для логов.
        this.url = url_.format( {
            ...this.http_options,
            //  url.format игнорит свойство path, но смотрит на pathname + query/search.
            pathname: pathname,
            query: options.query,
        } );

        this.http_options.headers = {};
        if ( options.headers ) {
            for ( const name in options.headers ) {
                this.http_options.headers[ name.toLowerCase() ] = options.headers[ name ];
            }
        }
        //  Add gzip headers.
        if ( this.http_options.headers[ 'accept-encoding' ] ) {
            this.http_options.headers[ 'accept-encoding' ] = 'gzip,deflate,' + this.http_options.headers[ 'accept-encoding' ];

        } else {
            this.http_options.headers[ 'accept-encoding' ] = 'gzip,deflate';
        }

        const method = this.http_options.method = options.method.toUpperCase();

        this.body = null;
        if ( options.body && ( method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE' ) ) {
            if ( Buffer.isBuffer( options.body ) ) {
                this.body = options.body;
                this.set_content_type( 'application/octet-stream' );

            } else if ( typeof options.body !== 'object' ) {
                this.body = String( options.body );
                this.set_content_type( 'text/plain' );

            } else if ( RX_IS_JSON.test( this.http_options.headers[ 'content-type' ] ) ) {
                this.body = JSON.stringify( options.body );

            } else {
                this.body = qs_.stringify( options.body );
                this.set_content_type( 'application/x-www-form-urlencoded' );
            }

            this.http_options.headers[ 'content-length' ] = Buffer.byteLength( this.body );
        }

        const is_https = ( this.http_options.protocol === 'https:' );
        this.request_module = ( is_https ) ? https_ : http_;

        if ( options.agent != null ) {
            if ( is_plain_object( options.agent ) ) {
                const agents_cache = ( is_https ) ? agents_cache_https : agents_cache_http;

                let agent = agents_cache.get( options.agent );
                if ( !agent ) {
                    agent = new this.request_module.Agent( options.agent );
                    agents_cache.set( options.agent, agent );
                }
                this.http_options.agent = agent;

            } else {
                //  Здесь может быть либо `false`, либо `instanceof Agent`.
                //  Либо еще что-нибудь, инстанс какого-то левого агента типа TunnelingAgent.
                //
                this.http_options.agent = options.agent;
            }
        }

        if ( this.http_options.protocol === 'https:' ) {
            this.http_options.pfx = options.pfx;
            this.http_options.key = options.key;
            this.http_options.passphrase = options.passphrase;
            this.http_options.cert = options.cert;
            this.http_options.ca = options.ca;
            this.http_options.ciphers = options.ciphers;
            this.http_options.rejectUnauthorized = options.rejectUnauthorized;
            this.http_options.secureProtocol = options.secureProtocol;
            this.http_options.servername = options.servername;
        }

        this.extra = options.extra;
    }

    set_content_type( content_type ) {
        if ( !this.http_options.headers[ 'content-type' ] ) {
            this.http_options.headers[ 'content-type' ] = content_type;
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

class Request {

    constructor( options, logger, context, cancel ) {
        this.options = options;
        this.logger = logger;
        this.context = context;
        this.cancel = cancel;

        this.timestamps = {};
        this.h_timeout = null;
        this.req = null;

        this.is_resolved = false;
    }

    start() {
        this.log( {
            type: Logger.EVENT.REQUEST_START,
            request_options: this.options,
        } );

        this.timestamps.start = Date.now();

        this.deferred = get_deferred();

        this.cancel.subscribe( ( error ) => this.do_cancel( create_error( {
            id: ERROR_ID.HTTP_REQUEST_ABORTED,
            reason: error,
        } ) ) );
        this.set_timeout();

        try {
            this.req = this.options.request_module.request( this.options.http_options, async ( res ) => {
                try {
                    const result = await this.request_handler( res );
                    this.do_done( result );

                } catch ( error ) {
                    this.do_fail( error );
                }
            } );

            let on_connect;

            this.req.on( 'socket', ( socket ) => {
                this.timestamps.socket = Date.now();

                if ( !socket.connecting ) {
                    //  Это сокет из пула, на нем не будет события 'connect'.
                    this.timestamps.tcp_connection = this.timestamps.socket;

                } else {
                    on_connect = () => {
                        this.timestamps.tcp_connection = Date.now();
                    };

                    socket.once( 'connect', on_connect );
                }
            } );

            this.req.on( 'error', ( error ) => {
                if ( on_connect && this.req.socket ) {
                    this.req.socket.removeListener( 'connect', on_connect );

                    on_connect = null;
                }

                if ( this.req.aborted ) {
                    //  FIXME: правда ли нет ситуация, когда это приведет к повисанию запроса?
                    return;
                }
                if ( this.is_resolved ) {
                    return;
                }

                error = {
                    id: ERROR_ID.HTTP_UNKNOWN_ERROR,
                    message: error.message,
                };
                this.destroy_request_socket();

                this.do_fail( error );
            } );

            if ( this.options.body ) {
                this.req.write( this.options.body );
            }

            this.req.end();

        } catch ( e ) {
            this.do_fail( e );
        }

        return this.deferred.promise;
    }

    do_done( result ) {
        if ( this.is_resolved ) {
            return;
        }

        this.clear_timeout();

        this.timestamps.end = this.timestamps.end || Date.now();

        this.log( {
            type: Logger.EVENT.REQUEST_SUCCESS,
            request_options: this.options,
            result: result,
            timestamps: this.timestamps,
        } );

        this.is_resolved = true;

        this.deferred.resolve( result );
    }

    do_fail( error ) {
        if ( this.is_resolved ) {
            return;
        }

        this.clear_timeout();

        this.timestamps.end = this.timestamps.end || Date.now();

        error = create_error( error );

        this.log( {
            type: Logger.EVENT.REQUEST_ERROR,
            request_options: this.options,
            error: error,
            timestamps: this.timestamps,
        } );

        this.is_resolved = true;

        this.deferred.reject( error );
    }

    do_cancel( error ) {
        if ( this.req ) {
            this.req.abort();
        }

        this.do_fail( error );
    }

    set_timeout() {
        if ( this.options.timeout > 0 ) {
            this.h_timeout = setTimeout( () => {
                let error;
                if ( !this.timestamps.tcp_connection ) {
                    //  Не смогли к этому моменту установить tcp-соединение.
                    error = {
                        id: ERROR_ID.TCP_CONNECTION_TIMEOUT,
                    };

                } else {
                    //  Тут просто слишком долго выполняли запрос целиком.
                    error = {
                        id: ERROR_ID.REQUEST_TIMEOUT,
                    };
                }

                this.do_cancel( error );

            }, this.options.timeout );
        }
    }

    clear_timeout() {
        if ( this.h_timeout ) {
            clearTimeout( this.h_timeout );
            this.h_timeout = null;
        }
    }

    destroy_request_socket() {
        if ( this.req && this.req.socket ) {
            this.req.socket.destroy();
        }
    }

    async request_handler( res ) {
        res.once( 'readable', () => {
            this.timestamps.first_byte = Date.now();
        } );

        const unzipped = unzip_response( res );

        const buffers = [];
        let received_length = 0;

        for await ( const chunk of unzipped ) {
            this.cancel.throw_if_cancelled();

            buffers.push( chunk );
            received_length += chunk.length;
        }

        if ( !res.complete ) {
            const error = create_error( {
                id: ERROR_ID.INCOMPLETE_RESPONSE,
            } );
            throw error;
        }

        const status_code = res.statusCode;
        const body = ( received_length ) ? Buffer.concat( buffers, received_length ) : null;
        const headers = res.headers;

        const error = create_error( {
            id: 'HTTP_' + status_code,
            status_code: status_code,
            headers: headers,
            body: body,
            message: http_.STATUS_CODES[ status_code ],
        } );
        if ( this.options.is_error( error, this.options ) ) {
            throw error;
        }

        return {
            status_code: status_code,
            request_options: this.options,
            headers: headers,
            timestamps: this.timestamps,
            body: body,
        };
    }

    log( event ) {
        if ( this.logger ) {
            this.logger.log( event, this.context );
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

async function request( options, logger, context, cancel ) {
    const request_options = new RequestOptions( options );

    while ( true ) {
        const req = new Request( request_options, logger, context, cancel );

        try {
            const result = await req.start();

            return result;

        } catch ( error ) {
            if ( error.error.status_code === 429 || error.error.status_code >= 500 ) {
                //  Удаляем сокет, чтобы не залипать на отвечающем ошибкой бекэнде.
                req.destroy_request_socket();
            }

            if ( request_options.retries < request_options.max_retries && request_options.is_retry_allowed( error, request_options ) ) {
                request_options.retries++;

                if ( request_options.retry_timeout > 0 ) {
                    await wait_for( request_options.retry_timeout );
                }

            } else {
                throw error;
            }
        }
    }
}

request.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

//  ---------------------------------------------------------------------------------------------------------------  //

function wait_for( timeout ) {
    return new Promise( ( resolve ) => {
        setTimeout( resolve, timeout );
    } );
}

function unzip_response( res ) {
    const content_encoding = res.headers[ 'content-encoding' ];

    if ( content_encoding === 'gzip' || content_encoding === 'deflate' ) {
        return res.pipe( zlib_.createUnzip() );
    }

    return res;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = request;

