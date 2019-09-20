const no = require( 'nommon' );

const Block = require( './block' );
const { ERROR_ID, is_error, create_error } = require( './error' );

const request = require( './request' );

const extend_option = require( './extend_option' );

//  ---------------------------------------------------------------------------------------------------------------  //

const rx_is_json = /^application\/json(?:;|\s|$)/;

const PROPS = [
    'agent',
    'auth',
    'ca',
    'cert',
    'ciphers',
    'family',
    'host',
    'hostname',
    'key',
    'max_retries',
    'method',
    'passphrase',
    'path',
    'pfx',
    'port',
    'protocol',
    'rejectUnauthorized',
    'secureProtocol',
    'servername',
    'timeout',
];

//  ---------------------------------------------------------------------------------------------------------------  //

class HttpBlock extends Block {

    _init_block( block ) {
        super._init_block( block );

        this._compiled_props = compile_props( this._block );
    }

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

    async _action( { run_context, block_cancel, deps_domain, cancel, params, context, deps } ) {
        const block = this._block;

        const callback_args = { params, context, deps };

        let options = {
            is_error: block.is_error,
            is_retry_allowed: block.is_retry_allowed,
            retry_timeout: block.retry_timeout,
        };

        this._compiled_props( options, callback_args );

        if ( options.method ) {
            options.method = options.method.toUpperCase();
        }

        if ( block.headers ) {
            options.headers = eval_headers( block.headers, callback_args );
        }

        if ( block.query ) {
            options.query = eval_query( block.query, callback_args );
        }

        if ( block.body !== undefined ) {
            options.body = eval_body( block.body, callback_args );
        }

        if ( this._options.name ) {
            options.extra = {
                name: this._options.name,
            };
        }

        if ( typeof block.prepare_request_options === 'function' ) {
            options = block.prepare_request_options( options );
        }

        let result;
        let headers;
        let error;

        try {
            const logger = this._options.logger;

            result = await request( options, logger, context, block_cancel );

        } catch ( error ) {
            result = error;
        }

        //  FIXME: А хорошо бы тут без is_error обойтись?
        //  Вроде без этого можно понять, ошибка была или нет.
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

function eval_headers( objects, callback_args ) {
    let headers = {};

    objects.forEach( ( object ) => {
        callback_args = { ...callback_args, headers };

        if ( typeof object === 'function' ) {
            const new_headers = object( callback_args );
            if ( new_headers && typeof new_headers === 'object' ) {
                headers = new_headers;
            }

        } else {
            headers = {};

            for ( const key in object ) {
                const value = object[ key ];
                headers[ key ] = ( typeof value === 'function' ) ? value( callback_args ) : value;
            }
        }
    } );

    return headers;
}

function eval_query( objects, callback_args ) {
    let query = {};

    const params = callback_args.params;

    objects.forEach( ( object ) => {
        callback_args = { ...callback_args, query };

        if ( typeof object === 'function' ) {
            const new_query = object( callback_args );
            if ( new_query && typeof new_query === 'object' ) {
                query = new_query;
            }

        } else {
            query = {};

            for ( const key in object ) {
                const p_value = params[ key ];
                const o_value = object[ key ];

                let value;
                if ( o_value === null ) {
                    value = p_value;

                } else if ( typeof o_value === 'function' ) {
                    value = o_value( callback_args );

                } else if ( o_value !== undefined ) {
                    value = ( p_value === undefined ) ? o_value : p_value;
                }

                if ( value !== undefined ) {
                    query[ key ] = value;
                }
            }
        }
    } );

    return query;
}

function eval_body( body, callback_args ) {
    if ( typeof body === 'string' || Buffer.isBuffer( body ) ) {
        return body;
    }

    if ( typeof body === 'function' ) {
        return body( callback_args );
    }

    return String( body );
}

function compile_props( block ) {
    let js = 'var v;';
    PROPS.forEach( ( prop ) => {
        const value = block[ prop ];
        if ( value != null ) {
            if ( typeof value === 'function' ) {
                js += `v=b["${ prop }"](a);`;
                js += `if (v!=null){o["${ prop }"]=v}`;

            } else {
                js += `o["${ prop }"]=b["${ prop }"];`;
            }
        }
    } );

    const compiled = Function( 'b', 'o', 'a', js );

    return function( options, callback_args ) {
        return compiled( block, options, callback_args );
    };
}

