const CompositeBlock = require( './composite_block' );

class ArrayBlock extends CompositeBlock {

    _init_block( array ) {
        const blocks = array.map( ( block, i ) => {
            return {
                index: i,
                block: block,
                priority: block._options.priority,
            };
        } );

        this._init_groups( blocks );
    }

    _action( cancel, params, context ) {
        return this._run_groups( cancel, params, context );
    }

}

module.exports = ArrayBlock;

