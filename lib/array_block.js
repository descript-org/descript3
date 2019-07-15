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

    _action( run_context, cancel, params, context, deps ) {
        return this._run_groups( run_context, cancel, params, context, deps );
    }

}

module.exports = ArrayBlock;

