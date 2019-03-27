const de = require( '../lib' );

const {
    wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'de.func', () => {

    test( 'resolves with value', async () => {
        const data = {
            foo: 42,
        };

        const block = get_result_block( data, 300 );
        const context = new de.Context();

        const result = await context.run( block );

        expect( result ).toBe( data );
    } );

    test( 'resolves with promise', async () => {
        const data = {
            foo: 42,
        };

        const block = de.func( {
            block: function() {
                return wait_for_value( data, 300 );
            },
        } );

        const context = new de.Context();

        const result = await context.run( block );

        expect( result ).toBe( data );
    } );

    test( 'resolves with block', async () => {
        const data = {
            foo: 42,
        };

        const block1 = get_result_block( data, 300 );
        const block2 = get_result_block( block1, 200 );

        const context = new de.Context();

        const result = await context.run( block2 );

        expect( result ).toBe( data );
    } );

    test( 'rejects with de.error', async () => {
        const error = de.error( {
            id: 'SOME_ERROR',
        } );

        const block = get_error_block( error, 300 );
        const context = new de.Context();

        expect.assertions( 1 );
        try {
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
        }

    } );

    test( 'cancellable', async () => {
        const block = get_result_block( null, 300 );
        const cancel = new de.Cancel();
        const context = new de.Context();

        const cancel_reason = de.error( {
            id: 'SOME_REASON',
        } );
        setTimeout( () => {
            cancel.cancel( cancel_reason );
        }, 150 );

        expect.assertions( 3 );
        try {
            await context.run( block, null, cancel );

        } catch ( error ) {
            expect( de.is_error( error ) ).toBe( true );
            expect( error.error.id ).toBe( de.ERROR_ID.CANCELLED );
            expect( error.error.reason ).toBe( cancel_reason );
        }
    } );

} );

