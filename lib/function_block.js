const Block = require( './block' );

class FunctionBlock extends Block {

    async _action( cancel, params, context ) {
        const result = await Promise.race( [
            this._block( { cancel, params, context } ),
            cancel.get_promise(),
        ] );

        return result;
    }

}

module.exports = FunctionBlock;

