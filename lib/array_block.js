const CompositeBlock = require( './composite_block' );

class ArrayBlock extends CompositeBlock {

    _init_block( blocks ) {
        this._blocks = blocks;
    }

    //  Сюда еще приходят deps последним параметром, но они не нужны здесь.
    //
    _action( args ) {
        return this._run_blocks( args );
    }

}

module.exports = ArrayBlock;

