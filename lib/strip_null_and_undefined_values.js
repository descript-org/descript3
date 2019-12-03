module.exports = function strip_null_and_undefined_values( obj ) {
    const r = {};

    for ( const key in obj ) {
        const value = obj[ key ];

        if ( value != null ) {
            r[ key ] = value;
        }
    }

    return r;
};

