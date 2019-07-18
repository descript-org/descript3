const Block = require( './block' );
const DepsDomain = require( './deps_domain' );

class FunctionBlock extends Block {

    async _action( { run_context, block_cancel, deps_domain, cancel, params, context, deps } ) {
        deps_domain = new DepsDomain( deps_domain );

        const result = await Promise.race( [
            this._block( {
                block_cancel: block_cancel,
                cancel: cancel,
                params: params,
                context: context,
                deps: deps,
                generate_id: deps_domain.generate_id,
            } ),
            block_cancel.get_promise(),
        ] );

        return run_context.run( {
            block: result,
            block_cancel: block_cancel.create(),
            deps_domain: deps_domain,
            cancel: cancel,
            params: params,
            context: context,
        } );
    }

}

module.exports = FunctionBlock;

