const no = require( 'nommon' );

const url_ = require( 'url' );
const http_ = require( 'http' );
const https_ = require( 'https' );
const qs_ = require( 'querystring' );

const { ERROR_ID } = require( './error' );

//  ---------------------------------------------------------------------------------------------------------------  //

const _agents = new WeakMap();

const RX_IS_JSON = /^application\/json(?:;|\s|$)/;

//  ---------------------------------------------------------------------------------------------------------------  //

class RequestOptions {
    constructor( options ) {
        //  NOTE: Тут не годится Object.assign, так как ключи с undefined перезатирают все.
        options = no.extend( {}, RequestOptions.DEFAULT_OPTIONS, options );

        this.retries = 0;
        this.redirects = 0;

        this.max_retries = options.max_retries;
        this.max_redirects = options.max_redirects;
        this.is_retry_allowed = options.is_retry_allowed;
        this.retry_timeout = options.retry_timeout;
        this.is_error = options.is_error;

        this.extra = options.extra;

        this.options = {};

        this.options.headers = {};
        if ( options.headers ) {
            for ( const name in options.headers ) {
                this.options.headers[ name.toLowerCase() ] = options.headers[ name ];
            }
        }

        //  Add gzip headers.
        if ( this.options.headers[ 'accept-encoding' ] ) {
            this.options.headers[ 'accept-encoding' ] = 'gzip, deflate, ' + this.options.headers[ 'accept-encoding' ];

        } else {
            this.options.headers[ 'accept-encoding' ] = 'gzip, deflate';
        }

        if ( options.url ) {
            const parsed_url = url_.parse( options.url, true );
            const query = Object.assign( parsed_url.query, options.query );

            this.options.protocol = parsed_url.protocol;
            this.options.hostname = parsed_url.hostname;
            this.options.port = Number( parsed_url.port );
            this.options.path = url_.format( {
                pathname: parsed_url.pathname,
                query: query,
            } );
            this.options.auth = parsed_url.auth;

            //  pathname и query не используются при запросе,
            //  но используются для построения урла ниже.
            //
            this.options.pathname = parsed_url.pathname;
            this.options.query = query;

        } else {
            this.options.protocol = options.protocol;
            this.options.hostname = options.host;
            this.options.port = options.port;
            this.options.path = url_.format( {
                pathname: options.path,
                query: options.query,
            } );

            this.options.pathname = options.path;
            this.options.query = options.query;
        }
        if ( !this.options.port ) {
            this.options.port = ( this.options.protocol === 'https:' ) ? 443 : 80;
        }

        if ( options.auth ) {
            this.options.auth = options.auth;
        }

        //  Нужно для логов.
        this.url = url_.format( this.options );

        const method = this.options.method = options.method.toUpperCase();

        this.body = null;
        if ( options.body && ( method === 'POST' || method === 'PUT' || method === 'PATCH' ) ) {
            if ( Buffer.isBuffer( options.body ) ) {
                this.body = options.body;
                this.set_content_type( 'application/octet-stream' );

            } else if ( typeof options.body !== 'object' ) {
                this.body = String( options.body );
                this.set_content_type( 'text/plain' );

            } else if ( RX_IS_JSON.test( this.options.headers[ 'content-type' ] ) ) {
                this.body = JSON.stringify( options.body );

            } else {
                this.body = qs_.stringify( options.body );
                this.set_content_type( 'application/x-www-form-urlencoded' );
            }

            this.options.headers[ 'content-length' ] = Buffer.byteLength( this.body );
        }

        this.request_module = ( this.options.protocol === 'https:' ) ? https_ : http_;

        if ( options.agent != null ) {
            if ( typeof options.agent === 'object' && !( options.agent instanceof this.request_module.Agent ) ) {
                let agent = _agents.get( options.agent );
                if ( !agent ) {
                    agent = new this.request_module.Agent( options.agent );
                    _agents.set( options.agent, agent );
                }
                this.options.agent = agent;

            } else {
                //  Здесь может быть либо `false`, либо `instanceof Agent`.
                this.options.agent = options.agent;
            }
        }

        if ( this.options.protocol === 'https:' ) {
            this.options.pfx = options.pfx;
            this.options.key = options.key;
            this.options.passphrase = options.passphrase;
            this.options.cert = options.cert;
            this.options.ca = options.ca;
            this.options.ciphers = options.ciphers;
            this.options.rejectUnauthorized = options.rejectUnauthorized;
            this.options.secureProtocol = options.secureProtocol;
            this.options.servername = options.servername;
        }
    }

    set_content_type( content_type ) {
        if ( !this.options.headers[ 'content-type' ] ) {
            this.options.headers[ 'content-type' ] = content_type;
        }
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

RequestOptions.DEFAULT_OPTIONS = {
    method: 'GET',
    protocol: 'http:',
    host: 'localhost',
    path: '/',

    max_redirects: 0,
    max_retries: 0,
    is_error: function( error ) {
        return (
            error.id === ERROR_ID.TCP_CONNECTION_TIMEOUT ||
            error.id === ERROR_ID.REQUEST_TIMEOUT ||
            error.status_code >= 400
        );
    },
    is_retry_allowed: function( error, request_options ) {
        if ( error.id === ERROR_ID.TCP_CONNECTION_TIMEOUT ) {
            return true;
        }

        const method = request_options.method;
        if ( method === 'POST' || method === 'PATCH' ) {
            return false;
        }

        return (
            error.id === ERROR_ID.REQUEST_TIMEOUT ||
            error.status_code === 408 ||
            error.status_code === 429 ||
            error.status_code === 500 ||
            ( error.status_code >= 502 && error.status_code <= 504 )
        );
    },
    retry_timeout: 100,
};

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = RequestOptions;

