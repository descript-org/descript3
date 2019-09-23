const CompositeBlock = require( './composite_block' );

class ArrayBlock extends CompositeBlock {

    _init_block( array ) {
        super._init_block( array );

        this._blocks = array.map( ( block, i ) => {
            return {
                block: block,
                key: i,
            };
        } );
    }

    //  Сюда еще приходят deps последним параметром, но они не нужны здесь.
    //
    _action( args ) {
        return this._run_blocks( args );
    }

}

module.exports = ArrayBlock;

