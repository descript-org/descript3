const de = require( '../lib' );

//  ---------------------------------------------------------------------------------------------------------------  //

let PATH_INDEX = 1;
function get_path() {
    return `/test/${ PATH_INDEX++ }/`;
}

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
            const { block_cancel } = args;
            if ( options.on_cancel ) {
                block_cancel.subscribe( options.on_cancel );
            }

            await Promise.race( [
                wait_for_value( null, timeout ),
                block_cancel.get_promise(),
            ] );

            if ( !de.is_block( value ) && ( typeof value === 'function' ) ) {
                return value( args );
            }

            return value;
        },
    } );
}

function get_error_block( error, timeout ) {
    if ( !de.is_block( error ) && ( typeof error === 'function' ) ) {
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

function set_timeout( callback, timeout ) {
    return new Promise( ( resolve ) => {
        setTimeout( () => {
            resolve( callback() );
        }, timeout );
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = {
    get_path,
    get_timeout,
    wait_for_value,
    wait_for_error,
    get_result_block,
    get_error_block,
    set_timeout,
};

