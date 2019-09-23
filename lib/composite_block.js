const no = require( 'nommon' );

const Block = require( './block' );
const { ERROR_ID, create_error } = require( './error' );

class CompositeBlock extends Block {

    _run_blocks( { run_context, block_cancel, deps_domain, cancel, params, context } ) {
        const promises = this._blocks.map( ( { block, key } ) => {
            return run_context.run( {
                block: block,
                block_cancel: block_cancel.create(),
                deps_domain: deps_domain,
                params: params,
                context: context,
                cancel: cancel,
            } )
                .catch( ( error ) => {
                    if ( block._options.required ) {
                        error = create_error( {
                            id: ERROR_ID.REQUIRED_BLOCK_FAILED,
                            path: get_error_path( key, error ),
                            //  FIXME: Что-то тут слишком много create_error. Нужно ли это?!
                            reason: create_error( error ),
                        } );
                        block_cancel.cancel( error );

                        throw error;
                    }

                    return error;
                } );
        } );

        return Promise.race( [
            Promise.all( promises ),
            block_cancel.get_promise(),
        ] );
    }

    block_action_started_in_context( run_context ) {
        //  Do nothing.
        //  console.log( 'composite.block_action_started_in_context', run_context._n_blocks, run_context._n_active_blocks );
    }

    block_action_stopped_in_context( context ) {
        //  Do nothing.
        //  console.log( 'composite.block_action_stopped_in_context', run_context._n_blocks, run_context._n_active_blocks );
    }
}

function get_error_path( key, error ) {
    let r = ( typeof key === 'number' ) ? `[ ${ key } ]` : `.${ key }`;

    const path = no.jpath( '.error.path', error );
    if ( path ) {
        r += path;
    }

    return r;
}

module.exports = CompositeBlock;

