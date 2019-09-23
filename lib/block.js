const no = require( 'nommon' );

const { create_error, ERROR_ID } = require( './error' );

const extend_option = require( './extend_option' );

const MAX_AFTERS_OR_ERRORS = 3;

//  ---------------------------------------------------------------------------------------------------------------  //

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
        return this._block;
    }

    _extend_options( options ) {
        return extend_options( this._options, options );
    }

    async _run( { run_context, block_cancel, deps_domain, cancel, params, context } ) {
        let h_timeout = null;

        function clear_timeout() {
            if ( h_timeout ) {
                clearTimeout( h_timeout );
                h_timeout = null;
            }
        }

        this.block_started_in_context( run_context );

        let error;
        let result;
        let deps;

        try {
            result = await ( async () => {
                deps = await this._do_options_deps( run_context, block_cancel, deps_domain );

                //  Тут не нужен cancel.
                params = this._get_params( params, context, deps );

                if ( this._options.timeout > 0 ) {
                    h_timeout = setTimeout( () => {
                        block_cancel.cancel( {
                            id: ERROR_ID.BLOCK_TIMED_OUT,
                        } );
                        h_timeout = null;
                    }, this._options.timeout );
                }

                let result = await this._do_options_before( block_cancel, cancel, params, context, deps );
                if ( result !== undefined ) {
                    return result;
                }

                const cache = this._options.cache;
                let key;
                const options_key = this._options.key;
                if ( cache && options_key ) {
                    //  И тут не нужен cancel.
                    key = ( typeof options_key === 'function' ) ? options_key( { params, context, deps } ) : options_key;
                    if ( typeof key !== 'string' ) {
                        key = null;
                    }
                    if ( key ) {
                        try {
                            result = await cache.get( key );

                        } catch ( e ) {
                            //  Do nothing.
                        }
                        block_cancel.throw_if_cancelled();

                        if ( result !== undefined ) {
                            return result;
                        }
                    }
                }

                this.block_action_started_in_context( run_context );
                try {
                    result = await this._action( { run_context, block_cancel, deps_domain, cancel, params, context, deps } );

                } finally {
                    this.block_action_stopped_in_context( run_context );
                }
                block_cancel.throw_if_cancelled();

                if ( result !== undefined && key ) {
                    cache.set( key, result, this._options.maxage );
                }

                return result;
            } )();

        } catch ( e ) {
            error = create_error( e );
        }

        let n = 0;
        while ( true ) {
            if ( error ) {
                try {
                    //  Была ошибка. Пытаемся исправить положение.
                    //
                    result = await this._do_options_error( block_cancel, cancel, params, context, deps, error );

                    //  Если мы дошли до сюда, значит options.error вернул что-то,
                    //  ошибка отменяется.
                    error = undefined;

                    //  Но история на этом не заканчивается.
                    //  На следующей итерации мы должны попасть в options.after.

                } catch ( e ) {
                    error = create_error( e );

                    //  Повторная ошибка. Фаталити!
                    break;
                }

            } else {
                try {
                    result = await this._do_options_after( block_cancel, cancel, params, context, deps, result );

                    //  Ошибки не было и after успешно отработал. На этом все.
                    break;

                } catch ( e ) {
                    error = create_error( e );

                    //  options.after упал, так что на следующей итерации попробуем восстановиться через options.error.
                    result = undefined;
                }
            }

            n++;
            if ( n >= MAX_AFTERS_OR_ERRORS ) {
                //  Тут можно зациклиться в связке after -> error -> after -> ...
                //  Пора остановиться.
                //
                error = create_error( {
                    id: ERROR_ID.TOO_MANY_AFTERS_OR_ERRORS,
                } );

                break;
            }
        }

        clear_timeout();

        block_cancel.close();

        this.block_stopped_in_context( run_context );

        if ( this._options.id ) {
            if ( error ) {
                run_context.reject_promise( this._options.id, error );

            } else {
                run_context.resolve_promise( this._options.id, result );
            }
        }

        if ( error ) {
            throw error;
        }

        return result;
    }

    async _do_options_deps( run_context, block_cancel, deps_domain ) {
        const deps = this._options.deps;
        if ( !deps || !deps.length ) {
            return;
        }

        if ( !deps_domain ) {
            throw create_error( {
                id: ERROR_ID.INVALID_DEPS_ID,
            } );
        }

        const promises = deps.map( ( id ) => {
            if ( !deps_domain.is_valid_id( id ) ) {
                throw create_error( {
                    id: ERROR_ID.INVALID_DEPS_ID,
                } );
            }

            return run_context.get_promise( id );
        } );

        run_context.waiting_for_deps.push( block_cancel );

        try {
            const results = await Promise.race( [
                block_cancel.get_promise(),
                Promise.all( promises ),
            ] );

            const r = {};

            deps.forEach( ( id, i ) => {
                r[ id ] = results[ i ];
            } );

            return r;

        } catch ( error ) {
            //  FIXME: А зачем вот это тут?
            const error_id = no.jpath( '.error.id', error );
            if ( error_id === ERROR_ID.DEPS_NOT_RESOLVED ) {
                throw error;
            }

            throw create_error( {
                id: ERROR_ID.DEPS_ERROR,
                reason: error,
            } );
        }
    }

    _get_params( params, context, deps ) {
        if ( this._options.params ) {
            this._options.params.forEach( ( item ) => {
                if ( typeof item === 'function' ) {
                    const new_params = item( { params, context, deps } );
                    if ( new_params && typeof new_params === 'object' ) {
                        params = new_params;
                    }

                } else {
                    params = eval_params_item( item, params, context, deps );
                }
            } );
        }

        return params;
    }

    async _do_options_before( block_cancel, cancel, params, context, deps ) {
        let result;

        const before = this._options.before;
        if ( before ) {
            const callback_args = { cancel, params, context, deps };

            for ( let i = 0; i < before.length; i++ ) {
                const callback = before[ i ];

                result = await callback( callback_args );
                block_cancel.throw_if_cancelled();

                if ( result !== undefined ) {
                    return result;
                }
            }
        }
    }

    async _do_options_after( block_cancel, cancel, params, context, deps, result ) {
        const option_after = this._options.after;
        if ( option_after ) {
            for ( let i = 0; i < option_after.length; i++ ) {
                const after_result = await option_after[ i ]( { cancel, params, context, deps, result } );
                block_cancel.throw_if_cancelled();

                result = ( after_result !== undefined ) ? after_result : result;
            }
        }

        return result;
    }

    async _do_options_error( block_cancel, cancel, params, context, deps, error ) {
        const option_error = this._options.error;
        if ( option_error ) {
            for ( let i = 0; i < option_error.length; i++ ) {
                try {
                    const result = await option_error[ i ]( { cancel, params, context, deps, error } );
                    block_cancel.throw_if_cancelled();

                    if ( result !== undefined ) {
                        return result;
                    }

                } catch ( e ) {
                    error = create_error( e );
                }
            }
        }

        throw error;
    }

    block_started_in_context( run_context ) {
        run_context.n_blocks++;
        //  console.log( 'block_started_in_context', run_context.n_blocks, run_context.n_active_blocks );
    }

    block_stopped_in_context( run_context ) {
        run_context.n_blocks--;
        //  console.log( 'block_stopped_in_context', run_context.n_blocks, run_context.n_active_blocks );

        run_context.queue_deps_check();
    }

    block_action_started_in_context( run_context ) {
        run_context.n_active_blocks++;
        //  console.log( 'block_action_started_in_context', run_context.n_blocks, run_context.n_active_blocks );
    }

    block_action_stopped_in_context( run_context ) {
        run_context.n_active_blocks--;
        //  console.log( 'block_action_stopped_in_context', run_context.n_blocks, run_context.n_active_blocks );
    }

}

Block.prototype = Object.create( Function.prototype );

module.exports = Block;

//  ---------------------------------------------------------------------------------------------------------------  //

function extend_options( what, by = {} ) {
    const options = {};

    options.name = by.name || what.name;

    options.id = by.id;
    options.deps = extend_deps( by.deps );

    options.params = extend_option( what.params, by.params );
    options.before = extend_option( by.before, what.before );
    options.after = extend_option( what.after, by.after );
    options.error = extend_option( what.error, by.error );

    options.timeout = by.timeout || what.timeout;

    options.key = by.key || what.key;
    options.maxage = by.maxage || what.maxage;
    options.cache = by.cache || what.cache;

    options.required = by.required;

    options.logger = by.logger || what.logger;

    return options;
}

function extend_deps( deps ) {
    if ( !deps ) {
        return null;
    }

    if ( !Array.isArray( deps ) ) {
        deps = [ deps ];
    }

    return ( deps.length ) ? deps : null;
}

function eval_params_item( item, params, context, deps ) {
    const r = {};

    const callback_args = { params, context, deps };

    for ( const p_name in item ) {
        const p_value = item[ p_name ];

        let value;
        if ( typeof p_value === 'function' ) {
            value = p_value( callback_args );

        } else if ( p_value === null ) {
            value = params[ p_name ];

        } else if ( p_value !== undefined ) {
            value = params[ p_name ];
            if ( value === undefined ) {
                value = p_value;
            }
        }

        if ( value !== undefined ) {
            r[ p_name ] = value;
        }
    }

    return r;
}

