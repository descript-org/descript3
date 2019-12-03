const strip_null_and_undefined_values = require( '../lib/strip_null_and_undefined_values' );

describe( 'strip_null_and_undefined_values', () => {

    test( 'returns copy', () => {
        const obj = {
            a: 'a',
            b: 'b',
        };
        const stripped = strip_null_and_undefined_values( obj );

        expect( stripped ).toStrictEqual( obj );
        expect( stripped ).not.toBe( obj );
    } );

    test( 'strip null and undefined', () => {
        const obj = {
            a: undefined,
            b: null,
            c: 0,
            d: '',
            e: false,
        };
        const stripped = strip_null_and_undefined_values( obj );

        expect( stripped ).toStrictEqual( {
            c: 0,
            d: '',
            e: false,
        } );
    } );

} );

