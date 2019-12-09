const { ERROR_ID, create_error } = require( './error' );

const Block = require( './block' );
const DepsDomain = require( './deps_domain' );

const get_deferred = require( './get_deferred' );

//  ---------------------------------------------------------------------------------------------------------------  //

class Context {

    constructor() {
        this.n_blocks = 0;
        this.n_active_blocks = 0;

        this.block_promises = {};
        this.block_results = {};
        this.waiting_for_deps = [];
    }

    get_promise( id ) {
        let deferred = this.block_promises[ id ];
        if ( !deferred ) {
            deferred = this.block_promises[ id ] = get_deferred();
        }

        return deferred.promise;
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
            if ( this.waiting_for_deps.length > 0 ) {
                this.waiting_for_deps.forEach( ( { block_cancel, n_parents } ) => {
                    if ( this.n_blocks > 0 && this.n_active_blocks <= n_parents ) {
                        //  console.log( 'DEPS FAILED', this.n_blocks, this.n_active_blocks, n_parents );
                        const error = create_error( {
                            id: ERROR_ID.DEPS_NOT_RESOLVED,
                        } );
                        block_cancel.cancel( error );
                    }
                } );
            }
        } );
    }

    async run( { block, block_cancel, deps_domain, params, context, cancel, prev, n_parents = 0 } ) {
        //  FIXME: А может block быть промисом?
        if ( block instanceof Block ) {
            //  На тот случай, когда у нас запускается один блок и у него сразу есть зависимости.
            this.queue_deps_check();

            while ( true ) {
                block = await block._run( {
                    run_context: this,
                    block_cancel: block_cancel,
                    deps_domain: deps_domain,
                    params: params,
                    context: context,
                    cancel: cancel,
                    prev: prev,
                    n_parents: n_parents,
                } );
                block_cancel.throw_if_cancelled();

                if ( !( block instanceof Block ) ) {
                    break;
                }

                //  FIXME: А не нужно ли тут n_parents инкрементить?

                block_cancel = block_cancel.create();
                deps_domain = new DepsDomain( deps_domain );
            }

        } else {
            block_cancel.close();
        }

        return block;
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Context;

