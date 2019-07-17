const { ERROR_ID, create_error } = require( './error' );

const Block = require( './block' );
const Cancel = require( './cancel' );
const DepsDomain = require( './deps_domain' );

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

    async run( block, deps_domain = null, { cancel, params, context } = {} ) {
        if ( !( params && typeof params === 'object' ) ) {
            params = {};
        }
        if ( !cancel ) {
            cancel = new Cancel();
        }

        //  У нас Block тоже является функцией,
        //  так что просто typeof block === 'function' недостаточно проверить.
        //
        if ( !( block instanceof Block ) && ( typeof block === 'function' ) ) {
            deps_domain = new DepsDomain( deps_domain );

            block = await block( {
                params: params,
                context: context,
                cancel: cancel,
                generate_id: deps_domain.generate_id,
            } );
        }
        if ( !( block instanceof Block ) ) {
            return block;
        }

        //  На тот случай, когда у нас запускается один блок и у него сразу есть зависимости.
        this.queue_deps_check();

        return block._run( this, deps_domain, cancel, params, context );
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Context;

