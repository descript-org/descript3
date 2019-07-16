const Block = require( './block' );
const { ERROR_ID, is_error, create_error } = require( './error' );

class CompositeBlock extends Block {

    _run_blocks( run_context, cancel, params, context, deps ) {
        const promises = this._blocks.map( async ( block ) => {
            const block_cancel = cancel.create();

            //  FIXME: Тут нужно запускать через de.run, но не через de.run.
            //  block может быть функцией, но запускать нужно в run_context.
            //
            try {
                const result = await block._run( run_context, block_cancel, params, context, deps );

                return result;

            } catch ( error ) {
                //  FIXME: Непонятно, почему тут именно is_error, а если там просто эксепшен?
                if ( block._options.required && is_error( error ) ) {
                    error = create_error( {
                        id: ERROR_ID.REQUIRED_BLOCK_FAILED,
                        //  TODO: path.
                        reason: error,
                    } );
                    cancel.cancel( error );

                    throw error;
                }

                return error;
            }
        } );

        return Promise.race( [
            Promise.all( promises ),
            cancel.get_promise(),
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

module.exports = CompositeBlock;

