const Block = require( './block' );
const { ERROR_ID, create_error } = require( './error' );

class FirstBlock extends Block {

    async _action( { run_context, block_cancel, deps_domain, cancel, params, context } ) {
        let prev = [];

        for ( let i = 0; i < this._block.length; i++ ) {
            const block = this._block[ i ];

            try {
                const result = await run_context.run( {
                    block: block,
                    block_cancel: block_cancel.create(),
                    deps_domain: deps_domain,
                    params: params,
                    context: context,
                    cancel: cancel,
                    prev: prev,
                } );

                return result;

            } catch ( e ) {
                prev = prev.concat( e );
            }
        }

        throw create_error( {
            id: ERROR_ID.ALL_BLOCKS_FAILED,
            reason: prev,
        } );
    }

}

module.exports = FirstBlock;

