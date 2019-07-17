const Block = require( './block' );
const DepsDomain = require( './deps_domain' );

class FunctionBlock extends Block {

    async _action( run_context, deps_domain, cancel, params, context, deps ) {
        deps_domain = new DepsDomain( deps_domain );

        const result = await Promise.race( [
            this._block( {
                cancel: cancel,
                params: params,
                context: context,
                deps: deps,
                generate_id: deps_domain.generate_id,
            } ),
            cancel.get_promise(),
        ] );
        cancel.throw_if_cancelled();

        return run_context.run( result, deps_domain, { cancel, params, context } );
    }

}

module.exports = FunctionBlock;

