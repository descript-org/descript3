const CompositeBlock = require( './composite_block' );

class ObjectBlock extends CompositeBlock {

    _init_block( object ) {
        super._init_block( object );

        const blocks = this._blocks = [];

        for ( const key in object ) {
            blocks.push( {
                block: object[ key ],
                key: key,
            } );
        }
    }

    async _action( args ) {
        const results = await this._run_blocks( args );

        const r = {};
        const blocks = this._blocks;
        results.forEach( ( result, i ) => {
            r[ blocks[ i ].key ] = result;
        } );
        return r;
    }

}

module.exports = ObjectBlock;

