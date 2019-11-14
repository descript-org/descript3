const Block = require( './block' );

class PipeBlock extends Block {

    async _action( { run_context, block_cancel, deps_domain, cancel, params, context } ) {
        let result;
        let prev = [];

        for ( let i = 0; i < this._block.length; i++ ) {
            const block = this._block[ i ];

            result = await run_context.run( {
                block: block,
                block_cancel: block_cancel.create(),
                deps_domain: deps_domain,
                params: params,
                context: context,
                cancel: cancel,
                prev: prev,
            } );

            prev = prev.concat( result );
        }

        return result;
    }

}

module.exports = PipeBlock;

