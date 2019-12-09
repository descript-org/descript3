const de = require( '../lib' );

describe( 'descript', () => {

    it( 'de.run( value )', async () => {
        const block = {
            foo: 42,
        };

        const result = await de.run( block );
        expect( result ).toBe( block );
    } );

    it.each( [
        [ 'de.func', de.func ],
        [ 'de.array', de.array ],
        [ 'de.object', de.object ],
        [ 'de.pipe', de.pipe ],
        [ 'de.first', de.first ],
    ] )( '%s without arguments', ( _, factory ) => {
        expect.assertions( 2 );
        try {
            factory();

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.INVALID_BLOCK );
        }
    } );

    it( 'de.http without arguments', () => {
        expect( () => de.http() ).not.toThrow();
    } );

} );

