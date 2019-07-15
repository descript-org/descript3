const Block = require( './block' );

class FunctionBlock extends Block {

    async _action( run_context, cancel, params, context, deps ) {
        const result = await Promise.race( [
            this._block( { cancel, params, context, deps } ),
            cancel.get_promise(),
        ] );
        cancel.throw_if_cancelled();

        if ( result instanceof Block ) {
            return result._run( run_context, cancel, params, context, deps );
        }

        return result;
    }

}

module.exports = FunctionBlock;

