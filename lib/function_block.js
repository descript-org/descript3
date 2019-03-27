const Block = require( './block' );

class FunctionBlock extends Block {

    async _action( cancel, params, context ) {
        const result = await Promise.race( [
            this._block( { cancel, params, context } ),
            cancel.get_promise(),
        ] );
        cancel.throw_if_cancelled();

        if ( result instanceof Block ) {
            return result._run( cancel, params, context );
        }

        return result;
    }

}

module.exports = FunctionBlock;

