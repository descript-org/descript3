const no = require( 'nommon' );

const { create_error, is_error, ERROR_ID } = require( './error' );

const extend_option = require( './extend_option' );

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

        //  FIXME: Как-то мож покрасивше можно?
        let action_started = false;
        try {
            this.block_started_in_context( context );

            const result = await ( async () => {
                params = this._get_params( params, context );

                //  FIXME: Запомнить, что вернулось.
                //  И передавать это потом в колбэки.
                //  Вместо context.get_result.
                const deps = await this._do_options_deps( cancel, params, context );
                cancel.throw_if_cancelled();

                this.block_action_started_in_context( context );
                action_started = true;

                this._do_options_guard( params, context );

                if ( this._options.timeout > 0 ) {
                    h_timeout = setTimeout( () => {
                        cancel.cancel( {
                            id: ERROR_ID.BLOCK_TIMED_OUT,
                        } );
                        h_timeout = null;
                    }, this._options.timeout );
                }

                let result = await this._do_options_before( cancel, params, context, deps );
                cancel.throw_if_cancelled();
                if ( result !== undefined ) {
                    return this._do_options_after( cancel, params, context, result );
                }

                //  FIXME: А не нужен ли тут try/catch?
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

            clear_timeout();

            cancel.close();

            if ( this._options.id ) {
                context.resolve_promise( this._options.id, result );
            }

            this.block_action_stopped_in_context( context );
            this.block_stopped_in_context( context );

            return result;

        } catch ( error ) {
            error = create_error( error );

            clear_timeout();

            cancel.close();

            if ( this._options.id ) {
                context.reject_promise( this._options.id, error );
            }

            if ( action_started ) {
                this.block_action_stopped_in_context( context );
            }
            this.block_stopped_in_context( context );

            //  FIXME: Вроде это не так:
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
                    no.extend( params, eval_params_item( item, params, context ) );
                    //  FIXME: Нужно так на самом деле:
                    //  params = no.extend( {}, params, eval_params_item( item, params, context ) );
                }
            } );
        }

        return params;
    }

    _do_options_deps( cancel, params, context ) {
        const deps = this._options.deps;

        if ( deps && deps.length ) {
            const promises = deps.map( ( item ) => context.get_promise( item ).promise );

            context._waiting_for_deps.push( cancel );

            return Promise.race( [
                cancel.get_promise(),
                Promise.all( promises ),
            ] )
                .then( ( results ) => {
                    const r = {};

                    deps.forEach( ( id, i ) => {
                        if ( typeof id === 'symbol' ) {
                            r[ id ] = results[ i ];
                        }
                    } );

                    return r;
                } )
                .catch( ( error ) => {
                    const error_id = no.jpath( '.error.id', error );
                    if ( error_id === ERROR_ID.DEPS_NOT_RESOLVED ) {
                        throw error;
                    }

                    throw create_error( {
                        id: ERROR_ID.DEPS_ERROR,
                        reason: error,
                    } );
                } );
        }

        return {};
    }

    _do_options_guard( params, context ) {
        const guard = this._options.guard;
        if ( guard ) {
            for ( let i = 0; i < guard.length; i++ ) {
                const result = guard[ i ]( { params, context } );
                if ( !result ) {
                    throw create_error( {
                        id: ERROR_ID.BLOCK_GUARDED,
                    } );
                }
            }
        }
    }

    async _do_options_before( cancel, params, context, deps ) {
        let result;

        const before = this._options.before;
        if ( before ) {
            for ( let i = 0; i < before.length; i++ ) {
                const callback = before[ i ];

                result = await callback( { params, context, deps } );
                cancel.throw_if_cancelled();

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

        if ( cache && this._options.key && this._options.maxage > 0 ) {
            const key = this._options.key( { params, context } );
            if ( key ) {
                return cache.set( key, value, this._options.maxage );
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

    block_started_in_context( context ) {
        context._n_blocks++;
        //  console.log( 'block_started_in_context', context._n_blocks, context._n_active_blocks );
    }

    block_stopped_in_context( context ) {
        context._n_blocks--;
        //  console.log( 'block_stopped_in_context', context._n_blocks, context._n_active_blocks );

        context.update_deps();
        context.queue_deps_check();
    }

    block_action_started_in_context( context ) {
        context._n_active_blocks++;
        //  console.log( 'block_action_started_in_context', context._n_blocks, context._n_active_blocks );
    }

    block_action_stopped_in_context( context ) {
        context._n_active_blocks--;
        //  console.log( 'block_action_stopped_in_context', context._n_blocks, context._n_active_blocks );
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

    options.deps = extend_deps( by.deps );
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

function extend_deps( deps ) {
    if ( !deps ) {
        return null;
    }

    if ( !Array.isArray( deps ) ) {
        deps = [ deps ];
    }
    deps = deps.filter( ( dep ) => ( typeof dep === 'symbol' || typeof dep === 'function' ) );

    return ( deps.length ) ? deps : null;
}

function eval_params_item( item, params, context ) {
    const r = {};

    for ( const p_name in item ) {
        const p_value = item[ p_name ];

        const value = ( typeof p_value === 'function' ) ? p_value( { params, context } ) : p_value;
        if ( value !== undefined ) {
            r[ p_name ] = value;
        }
    }

    return r;
}

