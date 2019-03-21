const EventEmitter = require( 'events' );

const { ERROR_ID, create_error } = require( './error' );
const Cancel = require( './cancel' );
const Logger = require( './logger' );

class Context {

    constructor( req, res ) {
        this.req = req;
        this.res = res;

        this._n_blocks = 0;
        this._n_active_blocks = 0;

        this.block_promises = {};
        this.block_results = {};
        this.condition_promises = [];

        this.logger = new Logger();

        this._cancel = new Cancel();
    }

    run( block, params = {}, cancel ) {
        cancel = this._cancel.create( cancel );

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

    block_queued() {
        this._n_blocks++;
    }

    block_started() {
        this._n_active_blocks++;
    }

    block_stopped() {
        this.condition_promises = this.condition_promises.filter( ( item ) => {
            const passed = item.condition();

            if ( passed ) {
                item.deferred.resolve();
            }

            return passed;
        } );

        this._n_active_blocks--;
        this._n_blocks--;

        this.queue_deps_check();
    }

    queue_deps_check() {
        //  FIXME.
        //  Do nothing.
    }

    abort( reason ) {
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

Object.assign( Context.prototype, EventEmitter.prototype );

function get_deferred() {
    let resolve;
    let reject;
    const promise = new Promise( function( _resolve, _reject ) {
        resolve = _resolve;
        reject = _reject;
    } );

    return {
        promise: promise,
        resolve: resolve,
        reject: reject,
    };
}

module.exports = Context;

