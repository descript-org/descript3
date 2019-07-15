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
        groups.push( group );
    }

    async _run_groups( run_context, cancel, params, context, deps ) {
        const result = [];

        const groups = this._groups;
        for ( let i = 0; i < groups.length; i++ ) {
            const group = groups[ i ];

            const promises = group.map( ( item ) => {
                const item_cancel = cancel.create();
                const promise = item.block._run( run_context, item_cancel, params, context, deps );

                return promise.catch( ( error ) => {
                    //  FIXME: Непонятно, почему тут именно is_error, а если там просто эксепшен?
                    if ( item.block._options.required && is_error( error ) ) {
                        error = create_error( {
                            id: ERROR_ID.REQUIRED_BLOCK_FAILED,
                            //  TODO: path.
                            reason: error,
                        } );
                        cancel.cancel( error );

                        throw error;
                    }

                    return error;
                } );
            } );

            const results = await Promise.race( [
                Promise.all( promises ),
                cancel.get_promise(),
            ] );

            group.forEach( ( item, i ) => {
                result[ item.index ] = results[ i ];
            } );
        }

        return result;
    }

    block_action_started_in_context( run_context ) {
        //  Do nothing.
        //  console.log( 'composite.block_action_started_in_context', run_context._n_blocks, run_context._n_active_blocks );
    }

    block_action_stopped_in_context( context ) {
        //  Do nothing.
        //  console.log( 'composite.block_action_stopped_in_context', run_context._n_blocks, run_context._n_active_blocks );
    }
}

module.exports = CompositeBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

function compare_blocks( a, b ) {
    return b.priority - a.priority;
}

