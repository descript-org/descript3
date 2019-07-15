const CompositeBlock = require( './composite_block' );

class ObjectBlock extends CompositeBlock {

    _init_block( object ) {
        const blocks = [];
        const keys = this._keys = [];
        let i = 0;
        for ( const key in object ) {
            const block = object[ key ];

            keys.push( key );

            blocks.push( {
                index: i,
                block: block,
                priority: block._options.priority,
            } );
            i++;
        }

        this._init_groups( blocks );
    }

    async _action( run_context, cancel, params, context, deps ) {
        const results = await this._run_groups( run_context, cancel, params, context, deps );

        const keys = this._keys;
        const r = {};
        results.forEach( ( result, i ) => {
            r[ keys[ i ] ] = result;
        } );
        return r;
    }

}

module.exports = ObjectBlock;

