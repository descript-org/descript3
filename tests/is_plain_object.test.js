const is_plain_object = require( '../lib/is_plain_object' );

describe( 'is_plain_object', () => {

    it.each( [ null, undefined, 'Hello' ] )( '%j', ( obj ) => {
        expect( is_plain_object( obj ) ).toBe( false );
    } );

    it( '{}', () => {
        const obj = {
            foo: 42,
        };

        expect( is_plain_object( obj ) ).toBe( true );
    } );

    it( 'Object.create(null)', () => {
        const obj = Object.create( null );

        expect( is_plain_object( obj ) ).toBe( true );
    } );

    it( 'instanceof Foo', () => {
        const Foo = function() {
            //  Do nothing.
        };
        const obj = new Foo();

        expect( is_plain_object( obj ) ).toBe( false );
    } );

} );

