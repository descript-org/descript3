const CompositeBlock = require( './composite_block' );
const { create_error, ERROR_ID } = require( './error' );

class ObjectBlock extends CompositeBlock {

    _init_block( object ) {
        if ( !( object && typeof object === 'object' ) ) {
            throw create_error( {
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an object',
            } );
        }

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

