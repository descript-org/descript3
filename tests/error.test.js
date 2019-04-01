const fs_ = require( 'fs' );

const de = require( '../lib' );

describe( 'de.error', () => {

    it( 'de.error from string', () => {
        const error_id = 'SOME_ERROR';
        const error = de.error( error_id );

        expect( error.error.id ).toBe( error_id );
    } );

    it( 'de.error from ReferenceError', () => {
        try {
            //  eslint-disable-next-line
            const a = b;

        } catch ( e ) {
            const error = de.error( e );

            expect( error.error.id ).toBe( 'ReferenceError' );
        }

    } );

    it( 'de.error from TypeError', () => {
        try {
            const b = null;
            //  eslint-disable-next-line no-unused-vars
            const a = b.foo;

        } catch ( e ) {
            const error = de.error( e );

            expect( error.error.id ).toBe( 'TypeError' );
        }

    } );

    it.skip( 'de.error from nodejs exception', () => {
        const filename = 'some_nonexistance_filename';

        expect.assertions( 1 );
        try {
            fs_.readFileSync( filename, 'utf-8' );

        } catch ( e ) {
            const error = de.error( e );

            expect( error.error.id ).toBe( 'UNKNOWN_ERROR' );
            expect( error.error.code ).toBe( 'ENOENT' );
            expect( error.error.syscall ).toBe( 'open' );
            //  FIXME: Может лучше .toBeDefined() использовать?
            expect( error.error.errno ).toBe( -2 );
        }
    } );

    it( 'de.is_error #1', () => {
        const error = de.error();

        expect( de.is_error( error ) ).toBe( true );
    } );

} );

