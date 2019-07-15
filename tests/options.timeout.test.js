const de = require( '../lib' );

const {
    get_result_block,
} = require( './helpers' );

describe( 'options.timeout', () => {

    it( 'fail after timeout', async () => {
        const block = get_result_block( null, 100 )( {
            options: {
                timeout: 50,
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.BLOCK_TIMED_OUT );
        }
    } );

    it( 'success before timeout', async () => {
        const data = {
            foo: 42,
        };
        const block = get_result_block( data, 50 )( {
            options: {
                timeout: 100,
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( data );
    } );

} );

