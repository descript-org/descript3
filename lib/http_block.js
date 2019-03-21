const Block = require( './block' );
const { ERROR_ID, is_error, create_error } = require( './error' );

const request = require( './request' );

//  ---------------------------------------------------------------------------------------------------------------  //

const rx_is_json = /^application\/json(?:;|\s|$)/;

const PROPS = [
    'method',
    'protocol',
    'port',
    'agent',
    'hostname',
    'host',
    'path',
    'max_retties',
];

//  ---------------------------------------------------------------------------------------------------------------  //

class HttpBlock extends Block {

    _extend_block( what, by ) {
        let headers;
        if ( !what.headers || !by.headers ) {
            headers = what.headers || by.headers || null;

        } else {
            headers = [].concat( what.headers, by.headers );
        }

        const block = { ...what, ...by };
        if ( headers ) {
            block.headers = headers;
        }

        return block;
    }

    async _action( cancel, params, context ) {
        const block = this._block;

        const callback_args = { params, context };

        const options = {
            max_redirects: block.max_redirects,
            is_error: block.is_error,
            is_retry_allowed: block.is_retry_allowed,
            retry_timeout: block.retry_timeout,

            //  Работает не так, как options.timeout!
            timeout: block.timeout,

            auth: block.auth,

            pfx: block.pfx,
            key: block.key,
            passphrase: block.passphrase,
            cert: block.cert,
            ca: block.ca,
            ciphers: block.ciphers,
            rejectUnauthorized: block.rejectUnauthorized,
            secureProtocol: block.secureProtocol,
            servername: block.servername,
        };

        if ( block.method ) {
            options.method = block.method.toUpperCase();
        }

        PROPS.forEach( ( prop ) => {
            const value = block[ prop ];

            options[ prop ] = ( typeof value === 'function' ) ? value( callback_args ) : value;
        } );

        /*
        if ( block.headers ) {
            if ( Array.isArray( block.headers ) ) {
                options.headers = {};
                for ( let i = 0; i < block.headers.length; i++ ) {
                    const item = block.headers[ i ];
                    if ( item ) {
                        Object.assign( options.headers, item( callback_args ) );
                    }
                }

            } else if ( typeof block.headers === 'function' ) {
                options.headers = block.headers( callback_args );
            }
            }
        */

        if ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) {
            if ( block.query ) {
                options.query = block.query( params, context );
            }
            options.body = ( block.body ) ? block.body( callback_args ) : params;

        } else {
            options.query = ( block.query ) ? block.query( callback_args ) : params;
        }

        if ( this._options.name ) {
            options.extra = {
                name: this._options.name,
            };
        }

        let result;
        let headers;
        let error;

        try {
            result = await request( cancel, options, context );

        } catch ( error ) {
            result = error;
        }
        console.log( result );

        if ( is_error( result ) ) {
            error = result.error;
            headers = error.headers;

        } else {
            headers = result.headers;
        }

        let is_json = block.is_json;
        if ( !is_json && headers ) {
            const content_type = headers[ 'content-type' ];
            if ( content_type ) {
                is_json = rx_is_json.test( content_type );
            }
        }

        if ( error && error.body && is_json ) {
            try {
                error.body = JSON.parse( error.body );

            } catch ( e ) {
                //  Do nothing.
            }
        }

        if ( error ) {
            throw create_error( error );
        }

        if ( block.only_meta ) {
            return {
                status_code: result.status_code,
                headers: result.headers,
                request_options: result.request_options,
            };
        }

        let body;
        if ( !result.body ) {
            body = null;

        } else {
            if ( is_json ) {
                try {
                    body = JSON.parse( result.body );

                } catch ( e ) {
                    throw create_error( e, ERROR_ID.INVALID_JSON );
                }

            } else {
                body = result.body;
            }
        }

        if ( block.with_meta ) {
            return {
                status_code: result.status_code,
                headers: result.headers,
                request_options: result.request_options,
                result: body,
            };
        }

        return body;
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = HttpBlock;

