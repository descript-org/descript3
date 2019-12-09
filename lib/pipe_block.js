const Block = require( './block' );
const { ERROR_ID, create_error } = require( './error' );

class PipeBlock extends Block {

    _init_block( array ) {
        if ( !Array.isArray( array ) ) {
            throw create_error( {
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an array',
            } );
        }

        super._init_block( array );
    }


    async _action( { run_context, block_cancel, deps_domain, cancel, params, context, n_parents } ) {
        let result;
        let prev = [];

        for ( let i = 0; i < this._block.length; i++ ) {
            const block = this._block[ i ];

            result = await run_context.run( {
                block: block,
                block_cancel: block_cancel.create(),
                deps_domain: deps_domain,
                params: params,
                context: context,
                cancel: cancel,
                prev: prev,
                n_parents: n_parents + 1,
            } );

            prev = prev.concat( result );
        }

        return result;
    }

}

module.exports = PipeBlock;

