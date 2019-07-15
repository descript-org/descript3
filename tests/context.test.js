const de = require( '../lib' );

const {
    get_result_block,
    set_timeout,
} = require( './helpers' );

describe.skip( 'context', () => {

    it( 'run non block', async () => {
        const block = {
            foo: 42,
        };

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( block );
    } );

    it( 'abort', async () => {
        const block = get_result_block( null, 100 );

        const context = new de.Context();
        const error = de.error( {
            id: 'ERROR',
        } );
        setTimeout( () => {
            context.abort( error );
        }, 50 );

        expect.assertions( 1 );
        try {
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

    it( 'abort without reason', async () => {
        const block = get_result_block( null, 100 );

        const context = new de.Context();
        setTimeout( () => {
            context.abort();
        }, 50 );

        expect.assertions( 2 );
        try {
            await context.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.UNKNOWN_ERROR );
        }
    } );

    it( 'abort after abort', async () => {
        const block = get_result_block( null, 150 );

        const context = new de.Context();
        const error_1 = de.error( {
            id: 'ERROR',
        } );
        set_timeout( () => {
            context.abort( error_1 );
        }, 50 );
        const error_2 = de.error( {
            id: 'ANOTHER_ERROR',
        } );
        const p = set_timeout( () => {
            context.abort( error_2 );
        }, 100 );

        expect.assertions( 1 );
        try {
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( error_1 );
        }
        await p;
    } );

} );

