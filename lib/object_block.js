const CompositeBlock = require( './composite_block' );

class ObjectBlock extends CompositeBlock {

    _init_block( object ) {
        const blocks = this._blocks = [];
        const keys = this._keys = [];

        for ( const key in object ) {
            keys.push( key );
            blocks.push( object[ key ] );
        }
    }

    async _action( run_context, cancel, params, context, deps ) {
        const results = await this._run_blocks( run_context, cancel, params, context, deps );

        const keys = this._keys;
        const r = {};
        results.forEach( ( result, i ) => {
            r[ keys[ i ] ] = result;
        } );
        return r;
    }

}

module.exports = ObjectBlock;

