const { gunzipSync } = require( 'node:zlib' );

expect.extend( {
    toBeValidGzip( received ) {
        //  http://www.zlib.org/rfc-gzip.html#header-trailer
        //  2.3.1. Member header and trailer
        //  These have the fixed values ID1 = 31 (0x1f), ID2 = 139 (0x8b), to identify the file as being in gzip format.
        return {
            message: () => `incorrect header check for ${ received }`,
            pass: received.slice( 0, 2 ).equals( Buffer.from( '1f8b', 'hex' ) ),
        };
    },
    toHaveUngzipValue( received, value ) {
        return {
            message: () => `expected ${ received } to be ${ value }`,
            pass: gunzipSync( received ).toString( 'utf-8' ) === value,
        };
    },
} );
