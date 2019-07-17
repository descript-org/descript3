const CompositeBlock = require( './composite_block' );

class ArrayBlock extends CompositeBlock {

    _init_block( blocks ) {
        this._blocks = blocks;
    }

    _action( run_context, deps_domain, cancel, params, context ) {
        return this._run_blocks( run_context, deps_domain, cancel, params, context );
    }

}

module.exports = ArrayBlock;

