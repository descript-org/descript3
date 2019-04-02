const de = require( '../lib' );

//  ---------------------------------------------------------------------------------------------------------------  //

function wait_for_value( value, timeout ) {
    if ( timeout > 0 ) {
        return new Promise( ( resolve ) => {
            setTimeout( () => {
                resolve( value );
            }, timeout );
        } );
    }

    return Promise.resolve( value );
}

function wait_for_error( error, timeout ) {
    if ( timeout > 0 ) {
        return new Promise( ( resolve, reject ) => {
            setTimeout( () => {
                reject( error );
            }, timeout );
        } );
    }

    return Promise.reject( error );
}

function get_result_block( value, timeout = 0, options = {} ) {
    return de.func( {
        block: async function( args ) {
            const { cancel } = args;
            if ( options.on_cancel ) {
                cancel.subscribe( options.on_cancel );
            }

            await Promise.race( [
                wait_for_value( null, timeout ),
                cancel.get_promise(),
            ] );

            if ( !de.is_block( value ) && ( typeof value === 'function' ) ) {
                value = value( args );
            }

            return value;
        },
    } );
}

function get_error_block( error, timeout ) {
    if ( !de.is_block( error ) && ( typeof value === 'function' ) ) {
        return de.func( {
            block: async function() {
                await wait_for_value( null, timeout );

                throw error();
            },
        } );
    }

    return de.func( {
        block: function() {
            return wait_for_error( error, timeout );
        },
    } );
}

function get_timeout( from, to ) {
    return Math.round( from + ( Math.random() * ( to - from ) ) );
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = {
    get_timeout,
    wait_for_value,
    wait_for_error,
    get_result_block,
    get_error_block,
};

