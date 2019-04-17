const Block = require( './block' );
const { ERROR_ID, create_error } = require( './error' );
const Cancel = require( './cancel' );
const Logger = require( './logger' );
const get_deferred = require( './get_deferred' );

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: Кажется, не нужна возможность делать несколько context.run().
//  Если нужно запустить несколько блоков, нужно сделать de.object или de.array.

//  FIXME: Сделать отдельный RunContext со всей служебной инфой.
//  И не давать к нему доступа.
//  Непонятно, как связывать context и run_context.
//  Или хранить WeakMap [ context ] => run_context.

class Context {

    constructor( req, res ) {
        this.req = req;
        this.res = res;

        this._n_blocks = 0;
        this._n_active_blocks = 0;

        this.block_promises = {};
        this.block_results = {};
        this.condition_promises = [];
        this._waiting_for_deps = [];

        this.logger = new Logger();

        this._cancel = new Cancel();
    }

    async run( block, params = {}, cancel_run ) {
        const cancel = this._cancel.create();
        if ( cancel_run ) {
            cancel_run.subscribe( ( reason ) => cancel.cancel( reason ) );
        }

        //  У нас Block тоже является функцией,
        //  так что просто typeof block === 'function'  недостаточно проверить.
        //
        if ( !( block instanceof Block ) && ( typeof block === 'function' ) ) {
            //  FIXME: Нужен ли тут cancel?
            block = await block( params, this );
        }
        if ( !( block instanceof Block ) ) {
            return block;
        }

        //  На тот случай, когда у нас запускается один блок и у него сразу есть зависимости.
        this.queue_deps_check();

        return block._run( cancel, params, this );
    }

    get_promise( id ) {
        if ( typeof id === 'function' ) {
            const deferred = get_deferred();

            this.condition_promises.push( {
                condition: id,
                deferred: deferred,
            } );

            return deferred;

        } else {
            let deferred = this.block_promises[ id ];
            if ( !deferred ) {
                deferred = this.block_promises[ id ] = get_deferred();
            }

            return deferred;
        }
    }

    //  FIXME: Может явно прокидывать результаты депсов в кэлбэки.
    //  И только тех, на которые блок был подписан.
    get_result( id ) {
        const result = this.block_results[ id ];
        if ( !result ) {
            throw create_error( {
                id: ERROR_ID.INVALID_RESULT,
            } );
        }

        return result;
    }

    resolve_promise( id, result ) {
        const deferred = this.block_promises[ id ];
        if ( deferred ) {
            this.block_results[ id ] = {
                result: result,
            };

            deferred.resolve( result );
        }
    }

    reject_promise( id, error ) {
        const deferred = this.block_promises[ id ];
        if ( deferred ) {
            this.block_results[ id ] = {
                error: error,
            };

            deferred.reject( error );
        }
    }

    update_deps() {
        this.condition_promises = this.condition_promises.filter( ( item ) => {
            const passed = Boolean( item.condition() );

            if ( passed ) {
                item.deferred.resolve();
            }

            return !passed;
        } );
    }

    queue_deps_check() {
        process.nextTick( () => {
            if ( this._n_blocks > 0 && this._n_active_blocks === 0 ) {
                //  console.log( 'DEPS FAILED', this._n_blocks, this._n_active_blocks );
                const error = create_error( {
                    id: ERROR_ID.DEPS_NOT_RESOLVED,
                } );

                this._waiting_for_deps.forEach( ( cancel ) => cancel.cancel( error ) );
                this._waiting_for_deps = [];
            }
        } );
    }

    abort( reason ) {
        if ( this._aborted ) {
            return;
        }

        reason = reason || create_error( {
            id: ERROR_ID.ABORTED,
        } );
        this._aborted = reason;

        this._cancel.cancel( reason );
    }

    is_aborted() {
        return this._aborted;
    }

    log( event ) {
        this.logger.log( event, this );
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Context;

