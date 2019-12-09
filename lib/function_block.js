const Block = require( './block' );
const DepsDomain = require( './deps_domain' );
const { create_error, ERROR_ID } = require( './error' );

class FunctionBlock extends Block {

    _init_block( block ) {
        if ( typeof block !== 'function' ) {
            throw create_error( {
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be a function',
            } );
        }

        super._init_block( block );
    }

    async _action( { run_context, block_cancel, deps_domain, cancel, params, context, deps, n_parents } ) {
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

        if ( result instanceof Block ) {
            return run_context.run( {
                block: result,
                block_cancel: block_cancel.create(),
                deps_domain: deps_domain,
                cancel: cancel,
                params: params,
                context: context,
                n_parents: n_parents + 1,
            } );
        }

        return result;
    }

}

module.exports = FunctionBlock;

