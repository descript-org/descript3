module.exports = function( dest ) {
    for ( let i = 1, l = arguments.length; i < l; i++ ) {
        const src = arguments[ i ];
        if ( src ) {
            for ( const key in src ) {
                const value = src[ key ];
                if ( value !== undefined ) {
                    dest[ key ] = value;
                }
            }
        }
    }

    return dest;
};

