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

function get_result_block( value, timeout ) {
    return de.func( {
        block: function() {
            return wait_for_value( value, timeout );
        },
    } );
}

function get_error_block( error, timeout ) {
    return de.func( {
        block: function() {
            return wait_for_error( error, timeout );
        },
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = {
    wait_for_value,
    wait_for_error,
    get_result_block,
    get_error_block,
};

