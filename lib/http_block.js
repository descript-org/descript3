const Block = require( './block' );
const { ERROR_ID, create_error } = require( './error' );

const request = require( './request' );

const extend = require( './extend' );
const extend_option = require( './extend_option' );
const strip_null_and_undefined_values = require( './strip_null_and_undefined_values' );

//  ---------------------------------------------------------------------------------------------------------------  //

const rx_is_json = /^application\/json(?:;|\s|$)/;

//  FIXME: Нужен разделить список на статический и динамический.
//
const PROPS = [
    'agent',
    'auth',
    'body_compress',
    'ca',
    'cert',
    'ciphers',
    'family',
    'hostname',
    'key',
    'max_retries',
    'method',
    'passphrase',
    'pathname',
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

        //  this._compiled_props = compile_props( this._block );
    }

    _extend_block( by = {} ) {
        const what = this._block;
        const headers = extend_option( what.headers, by.headers );
        const query = extend_option( what.query, by.query );

        const block = extend( {}, what, by );
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

        PROPS.forEach( ( prop ) => {
            let value = block[ prop ];
            if ( typeof value === 'function' ) {
                value = value( callback_args );
            }
            if ( value != null ) {
                options[ prop ] = value;
            }
        } );
        //  TODO: Надо пострелять, чтобы понять, стоит ли городить эту оптимизацию.
        //  Блоки часто будут создаваться динамически, внутри замыкания с generate_id,
        //  так что стоимость компиляции может быть больше, чем просто тупой цикл.
        //
        //  this._compiled_props( options, callback_args );

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
            headers = result.headers;

        } catch ( e ) {
            error = e.error;
            headers = error.headers;
        }

        if ( error ) {
            if ( error.body ) {
                const result = { body: error.body, headers: headers };
                if ( typeof block.parse_body === 'function' ) {
                    try {
                        error.body = block.parse_body( result, context );

                    } catch ( e ) {
                        //  Do nothing
                    }

                } else {
                    error.body = this._parse_error_body( result );
                }
            }

            throw create_error( error );
        }

        let body = null;
        if ( typeof block.parse_body === 'function' ) {
            try {
                body = block.parse_body( result, context );

            } catch ( e ) {
                throw create_error( e, ERROR_ID.PARSE_BODY_ERROR );
            }

        } else if ( result.body ) {
            body = this._parse_body( result );
        }

        return {
            status_code: result.status_code,
            headers: result.headers,
            request_options: result.request_options,
            result: body,
        };
    }

    _parse_body( { body, headers } ) {
        const is_json = this._is_json_response( headers );
        if ( is_json ) {
            try {
                return JSON.parse( body );

            } catch ( e ) {
                throw create_error( e, ERROR_ID.INVALID_JSON );
            }
        }

        return String( body );
    }

    _parse_error_body( { body, headers } ) {
        const is_json = this._is_json_response( headers );
        if ( is_json ) {
            try {
                return JSON.parse( body );

            } catch ( e ) {
                //  Do nothing.
            }
        }

        if ( Buffer.isBuffer( body ) ) {
            return body.toString();
        }

        return body;
    }

    _is_json_response( headers ) {
        let is_json = this._block.is_json;
        if ( !is_json && headers ) {
            const content_type = headers[ 'content-type' ];
            if ( content_type ) {
                is_json = rx_is_json.test( content_type );
            }
        }

        return is_json;
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = HttpBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

function eval_headers( objects, callback_args ) {
    let headers = {};

    if ( Array.isArray( objects ) ) {
        objects.forEach( ( object ) => {
            headers = eval_headers_object( headers, object, callback_args );
        } );

    } else {
        headers = eval_headers_object( headers, objects, callback_args );
    }

    return headers;
}

function eval_headers_object( headers, object, callback_args ) {
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

    return headers;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function eval_query( objects, callback_args ) {
    let query = {};

    if ( Array.isArray( objects ) ) {
        objects.forEach( ( object ) => {
            query = eval_query_object( query, object, callback_args );
        } );

    } else {
        query = eval_query_object( query, objects, callback_args );
    }

    return query;
}

function eval_query_object( query, object, callback_args ) {
    const params = callback_args.params;

    callback_args = { ...callback_args, query };

    if ( typeof object === 'function' ) {
        const new_query = object( callback_args );
        if ( new_query && typeof new_query === 'object' ) {
            query = strip_null_and_undefined_values( new_query );
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

    return query;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function eval_body( body, callback_args ) {
    if ( typeof body === 'string' || Buffer.isBuffer( body ) ) {
        return body;
    }

    if ( typeof body === 'function' ) {
        return body( callback_args );
    }

    return String( body );
}

/*
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
*/
