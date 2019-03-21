const Block = require( './block' );
const { ERROR_ID, is_error, create_error } = require( './error' );

class CompositeBlock extends Block {

    _init_groups( items ) {
        const groups = this._groups = [];

        const l = items.length;
        if ( !l ) {
            return;
        }

        items.sort( compare_blocks );

        const item = items[ 0 ];
        let group = [ item ];
        let group_priority = item.priority;
        for ( let i = 1; i < l; i++ ) {
            const item = items[ i ];

            if ( item.priority !== group_priority ) {
                groups.push( group );
                group = [];
                group_priority = item.priority;
            }

            group.push( item );
        }

        if ( group.length ) {
            groups.push( group );
        }
    }

    async _run_groups( cancel, params, context ) {
        const result = [];

        const composite_cancel = cancel.create();

        const groups = this._groups;
        for ( let i = 0; i < groups.length; i++ ) {
            const group = groups[ i ];

            const promises = group.map( ( item ) => {
                const promise = item.block._run( composite_cancel, params, context );

                return promise.catch( ( error ) => {
                    if ( item.block._options.required && is_error( error ) ) {

                        error = create_error( {
                            id: ERROR_ID.REQUIRED_BLOCK_FAILED,
                            //  TODO: path.
                            parent: error,
                        } );
                        composite_cancel.cancel( error );

                        throw error;
                    }

                    return error;
                } );
            } );

            const results = await Promise.all( promises );
            composite_cancel.throw_if_cancelled();

            group.forEach( ( item, i ) => {
                result[ item.index ] = results[ i ];
            } );
        }

        return result;
    }

}

module.exports = CompositeBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

function compare_blocks( a, b ) {
    return b.priority - a.priority;
}

