const { create_error, is_error, ERROR_ID } = require( './error' );

class Block {

    constructor( block, options ) {
        const f = function( { block, options } = {} ) {
            return new f.constructor(
                f._extend_block( block ),
                f._extend_options( options )
            );
        };

        f.__proto__ = this.__proto__;
        f._init_block( block );
        f._init_options( options );

        return f;
    }

    _init_block( block ) {
        this._block = block;
    }

    _init_options( options ) {
        this._options = extend_options( {}, options );
    }

    _extend_block( block ) {
        return block || this._block;
    }

    _extend_options( options ) {
        return extend_options( this._options, options );
    }

    async _run( cancel, params, context ) {
        let h_timeout = null;

        function clear_timeout() {
            if ( h_timeout ) {
                clearTimeout( h_timeout );
                h_timeout = null;
            }
        }

        try {
            context.block_queued();

            const result = await ( async () => {
                params = this._get_params( params, context );

                await this._do_options_deps( cancel, params, context );
                cancel.throw_if_cancelled();

                context.block_started();

                this._do_options_guard( params, context );

                if ( this._options.timeout > 0 ) {
                    h_timeout = setTimeout( () => {
                        cancel.cancel( {
                            id: ERROR_ID.BLOCK_TIMED_OUT,
                        } );
                        h_timeout = null;
                    }, this._options.timeout );
                }

                let result = await this._do_options_before( cancel, params, context );
                cancel.throw_if_cancelled();
                if ( result !== undefined ) {
                    return this._do_options_after( cancel, params, context, result );
                }

                result = await this._get_from_cache( params, context );
                cancel.throw_if_cancelled();
                if ( result !== undefined ) {
                    return this._do_options_after( cancel, params, context, result );
                }

                result = await this._action( cancel, params, context );
                cancel.throw_if_cancelled();

                result = await this._do_options_after( cancel, params, context, result );
                cancel.throw_if_cancelled();

                if ( result !== undefined ) {
                    this._set_to_cache( params, context, result );
                }

                return result;
            } )();

            context.block_stopped();

            clear_timeout();

            if ( this._options.id ) {
                context.resolve_promise( this._options.id, result );
            }

            return result;

        } catch ( error ) {
            error = create_error( error );

            context.block_stopped();

            clear_timeout();

            if ( this._options.id ) {
                context.reject_promise( this._options.id, error );
            }

            //  _do_options_error не кидает исключений, так что try/catch тут не нужен.
            //
            return this._do_options_error( cancel, params, context, error );
        }
    }

    _get_params( params, context ) {
        if ( this._options.params ) {
            this._options.params.forEach( ( item ) => {
                if ( typeof item === 'function' ) {
                    params = item( { params, context } ) || {};

                } else {
                    Object.assign( params, eval_params_item( item, params, context ) );
                }
            } );
        }

        return params;
    }

    _do_options_deps( cancel, params, context ) {
        const deps = this._options.deps;


        if ( deps && deps.length ) {
            const promises = deps.map( ( item ) => context.get_promise( item ).promise );

            return Promise.race( [
                cancel.get_promise(),
                Promise.all( promises ),
            ] )
                .catch( ( error ) => {
                    throw create_error( {
                        id: ERROR_ID.DEPS_ERROR,
                        parent: error,
                    } );
                } );
        }
    }

    _do_options_guard( params, context ) {
        const guard = this._options.guard;
        if ( guard ) {
            for ( let i = 0; i < guard.length; i++ ) {
                const result = guard[ i ]( { params, context } );
                if ( !result ) {
                    throw create_error( ERROR_ID.BLOCK_GUARDED );
                }
            }
        }
    }

    async _do_options_before( cancel, params, context ) {
        let result;

        const before = this._options.before;
        if ( before ) {
            for ( let i = 0; i < before.length; i++ ) {
                const callback = before[ i ];

                result = await callback( { params, context } );
                cancel.throw_if_cancelled();
                //  FIXME: Если вернулся de.error без эксепшена?

                if ( result !== undefined ) {
                    return result;
                }
            }
        }
    }

    _get_from_cache( params, context ) {
        const cache = this._options.cache || context.cache;

        if ( cache && this._options.key ) {
            const key = this._options.key( { params, context } );
            if ( key ) {
                return cache.get( key );
            }
        }
    }

    //  FIXME: Может засунуть это в _run? Чтобы не вычислять два раза key.
    _set_to_cache( params, context, value ) {
        const cache = this._options.cache || context.cache;

        if ( cache && this._options.key ) {
            const key = this._options.key( { params, context } );
            if ( key ) {
                return cache.set( key, value );
            }
        }
    }

    async _do_options_after( cancel, params, context, result ) {
        const option_after = this._options.after;
        if ( option_after ) {
            for ( let i = 0; i < option_after.length; i++ ) {
                const after_result = await option_after[ i ]( { params, context, result } );
                cancel.throw_if_cancelled();

                result = ( after_result !== undefined ) ? after_result : result;
            }
        }

        return result;
    }

    _do_options_error( cancel, params, context, error ) {
        error = create_error( error );

        const option_error = this._options.error;
        if ( option_error ) {
            for ( let i = 0; i < option_error.length; i++ ) {
                const result = option_error[ i ]( { params, context, error } );
                if ( result !== undefined && !is_error( result ) ) {
                    return this._do_options_after( cancel, params, context, result );
                }
                error = result || error;
            }
        }

        throw error;
    }
}

Block.prototype = Object.create( Function.prototype );

module.exports = Block;

//  ---------------------------------------------------------------------------------------------------------------  //

function extend_options( what = {}, by = {} ) {
    const options = {};

    if ( typeof by.id === 'symbol' ) {
        options.id = by.id;
    }
    options.name = by.name || what.name;

    options.deps = by.deps;
    options.priority = Number( by.priority ) || 0;

    options.params = extend_option( what.params, by.params );
    options.guard = extend_option( what.guard, by.guard );
    options.before = extend_option( by.before, what.before );
    options.after = extend_option( what.after, by.after );
    options.error = extend_option( what.error, by.error );
    options.result = extend_option( what.result, by.result );

    options.timeout = by.timeout || what.timeout;

    options.key = by.key || what.key;
    options.maxage = by.maxage || what.maxage;
    options.cache = by.cache || what.cache;

    options.required = by.required;

    return options;
}

function extend_option( what, by ) {
    if ( what ) {
        if ( by ) {
            return [].concat( what, by );
        }

        return [].concat( what );
    }

    if ( by ) {
        return [].concat( by );
    }

    return null;
}

function eval_params_item( item, params, context ) {
    const r = {};

    for ( const p_name in item ) {
        const p_value = item[ p_name ];

        const value = ( typeof p_value === 'function' ) ? p_value( { params, context } ) : p_value;
        if ( value != null ) {
            r[ p_name ] = value;
        }
    }

    return r;
}

