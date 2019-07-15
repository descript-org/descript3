const no = require( 'nommon' );

const Block = require( './block' );
const { ERROR_ID, is_error, create_error } = require( './error' );

const request = require( './request' );

const extend_option = require( './extend_option' );

//  ---------------------------------------------------------------------------------------------------------------  //

const rx_is_json = /^application\/json(?:;|\s|$)/;

const PROPS = [
    'method',
    'protocol',
    'port',
    'hostname',
    'host',
    'path',
    'max_retries',
    'timeout',
    'auth',
    'agent',
    'pfx',
    'key',
    'passphrase',
    'cert',
    'ca',
    'ciphers',
    'rejectUnauthorized',
    'secureProtocol',
    'servername',
];

//  ---------------------------------------------------------------------------------------------------------------  //

class HttpBlock extends Block {

    /*
    _init_block( block ) {
    }
    */

    _extend_block( by = {} ) {
        const what = this._block;
        const headers = extend_option( what.headers, by.headers );
        const query = extend_option( what.query, by.query );

        const block = no.extend( {}, what, by );
        if ( headers ) {
            block.headers = headers;
        }
        if ( query ) {
            block.query = query;
        }

        return block;
    }

    async _action( run_context, cancel, params, context, deps ) {
        const block = this._block;

        const callback_args = { params, context, deps };

        const options = {
            is_error: block.is_error,
            is_retry_allowed: block.is_retry_allowed,
            retry_timeout: block.retry_timeout,
        };

        if ( block.method ) {
            options.method = block.method.toUpperCase();
        }

        PROPS.forEach( ( prop ) => {
            let value = block[ prop ];
            if ( typeof value === 'function' ) {
                value = value( callback_args );
            }
            if ( value != null ) {
                options[ prop ] = value;
            }
        } );

        if ( block.headers ) {
            options.headers = filter_null_values( eval_objects( block.headers, callback_args ) );
        }

        if ( block.query ) {
            options.query = filter_null_values( eval_objects( block.query, callback_args ) );
        }

        if ( block.body && ( options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' ) ) {
            if ( typeof block.body === 'string' || Buffer.isBuffer( block.body ) ) {
                options.body = block.body;

            } else if ( typeof block.body === 'function' ) {
                options.body = block.body( callback_args );

            } else if ( typeof block.body === 'object' ) {
                options.body = filter_null_values( eval_object( block.body, callback_args ) );

            } else {
                options.body = block.body.toString();
            }
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
            const logger = this._options.logger;

            result = await request( options, logger, cancel );

        } catch ( error ) {
            result = error;
        }

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

        if ( error ) {
            if ( error.body ) {
                if ( is_json ) {
                    try {
                        error.body = JSON.parse( error.body );

                    } catch ( e ) {
                        //  Do nothing.
                    }
                }

                if ( Buffer.isBuffer( error.body ) ) {
                    error.body = error.body.toString();
                }
            }

            throw create_error( error );
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
                body = String( result.body );
            }
        }

        return {
            status_code: result.status_code,
            headers: result.headers,
            request_options: result.request_options,
            result: body,
        };
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = HttpBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

function eval_objects( objects, callback_args ) {
    const result = {};

    objects.forEach( ( object ) => {
        if ( typeof object === 'function' ) {
            no.extend( result, object( callback_args ) );

        } else {
            for ( const key in object ) {
                let value = object[ key ];

                if ( typeof value === 'function' ) {
                    value = value( callback_args );
                }

                if ( value !== undefined ) {
                    result[ key ] = value;
                }
            }
        }
    } );

    return result;
}

function eval_object( object, callback_args ) {
    const result = {};

    for ( const key in object ) {
        let value = object[ key ];

        if ( typeof value === 'function' ) {
            value = value( callback_args );
        }

        if ( value !== undefined ) {
            result[ key ] = value;
        }
    }

    return result;
}

function filter_null_values( object ) {
    const result = {};

    for ( const key in object ) {
        const value = object[ key ];

        if ( value != null ) {
            result[ key ] = value;
        }
    }

    return result;
}

