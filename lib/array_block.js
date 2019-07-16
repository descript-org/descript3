const CompositeBlock = require( './composite_block' );

class ArrayBlock extends CompositeBlock {

    _init_block( blocks ) {
        this._blocks = blocks;
    }

    _action( run_context, cancel, params, context, deps ) {
        return this._run_blocks( run_context, cancel, params, context, deps );
    }

}

module.exports = ArrayBlock;

