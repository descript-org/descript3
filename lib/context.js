const { ERROR_ID, create_error } = require( './error' );

const get_deferred = require( './get_deferred' );

//  ---------------------------------------------------------------------------------------------------------------  //

class Context {

    constructor() {
        this._n_blocks = 0;
        this._n_active_blocks = 0;

        this.block_promises = {};
        this.block_results = {};
        this._waiting_for_deps = [];
    }

    //  FIXME: Возвращать отсюда deferred.promise?
    get_promise( id ) {
        let deferred = this.block_promises[ id ];
        if ( !deferred ) {
            deferred = this.block_promises[ id ] = get_deferred();
        }

        return deferred;
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

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Context;

