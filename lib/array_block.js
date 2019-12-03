const CompositeBlock = require( './composite_block' );
const { create_error, ERROR_ID } = require( './error' );

class ArrayBlock extends CompositeBlock {

    _init_block( array ) {
        if ( !Array.isArray( array ) ) {
            throw create_error( {
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an array',
            } );
        }

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

