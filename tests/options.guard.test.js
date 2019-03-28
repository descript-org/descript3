const de = require( '../lib' );

const {
    get_result_block,
} = require( './helpers' );

describe( 'options.guard', () => {

    it( 'guard returns true', async () => {
        const data = {
            foo: 42,
        };
        const block = get_result_block( data, 50 )( {
            options: {
                guard: () => true,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( data );
    } );

    it( 'guard returns false', async () => {
        const data = {
            foo: 42,
        };
        const block = get_result_block( data, 50 )( {
            options: {
                guard: () => false,
            },
        } );

        expect.assertions( 2 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( error ) {
            expect( de.is_error( error ) ).toBe( true );
            expect( error.error.id ).toBe( de.ERROR_ID.BLOCK_GUARDED );
        }
    } );

    it( 'guard throws', async () => {
        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        const block = get_result_block( null, 50 )( {
            options: {
                guard: () => {
                    throw error;
                },
            },
        } );

        expect.assertions( 1 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

    it( 'guard receives arguments', async () => {
        const spy = jest.fn( () => true );
        const block = get_result_block( null, 50 )( {
            options: {
                guard: spy,
            },
        } );

        const context = new de.Context();
        const params = {
            id: 66,
        };
        await context.run( block, params );

        const calls = spy.mock.calls;
        expect( calls.length ).toBe( 1 );
        expect( calls[ 0 ].length ).toBe( 1 );
        expect( calls[ 0 ][ 0 ].params ).toBe( params );
        expect( calls[ 0 ][ 0 ].context ).toBe( context );
    } );

    it( 'array of guards #1', async () => {
        const spy = jest.fn( () => true );

        const block = get_result_block( null, 50 )( {
            options: {
                guard: [
                    () => spy( 'FOO' ),
                    () => spy( 'BAR' ),
                ],
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;
        expect( calls.length ).toBe( 2 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
    } );

    it( 'array of guards #2', async () => {
        const spy = jest.fn()
            .mockReturnValueOnce( false )
            .mockReturnValueOnce( true );

        const block = get_result_block( null, 50 )( {
            options: {
                guard: [
                    () => spy( 'FOO' ),
                    () => spy( 'BAR' ),
                ],
            },
        } );

        expect.assertions( 2 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 1 );
            expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        }
    } );

    it( 'guard inheritence #1', async () => {
        const spy = jest.fn( () => true );

        const block_1 = get_result_block( null, 50 )( {
            options: {
                guard: () => spy( 'FOO' ),
            },
        } );
        const block_2 = block_1( {
            options: {
                guard: () => spy( 'BAR' ),
            },
        } );

        const context = new de.Context();
        await context.run( block_2 );

        const calls = spy.mock.calls;
        expect( calls.length ).toBe( 2 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
    } );

    it( 'guard inheritence #2', async () => {
        const spy = jest.fn()
            .mockReturnValueOnce( false )
            .mockReturnValueOnce( true );

        const block_1 = get_result_block( null, 50 )( {
            options: {
                guard: () => spy( 'FOO' ),
            },
        } );
        const block_2 = block_1( {
            options: {
                guard: () => spy( 'BAR' ),
            },
        } );

        expect.assertions( 2 );
        try {
            const context = new de.Context();
            await context.run( block_2 );

        } catch ( e ) {
            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 1 );
            expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        }
    } );

    it( 'guard inheritence #3', async () => {
        const spy = jest.fn()
            .mockReturnValueOnce( true )
            .mockReturnValueOnce( false );

        const block_1 = get_result_block( null, 50 )( {
            options: {
                guard: () => spy( 'FOO' ),
            },
        } );
        const block_2 = block_1( {
            options: {
                guard: () => spy( 'BAR' ),
            },
        } );

        expect.assertions( 3 );
        try {
            const context = new de.Context();
            await context.run( block_2 );

        } catch ( e ) {
            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 2 );
            expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
            expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
        }
    } );

    it( 'action is not called if guard failed', async () => {
        const spy = jest.fn();

        const block = get_result_block( spy, 50 )( {
            options: {
                guard: () => false,
            },
        } );

        expect.assertions( 1 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( spy.mock.calls.length ).toBe( 0 );
        }
    } );

    it( 'guard is not called if deps failed', async () => {
        const spy = jest.fn();

        const block = get_result_block( null, 50 )( {
            options: {
                deps: () => false,
                guard: spy,
            },
        } );

        expect.assertions( 1 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( spy.mock.calls.length ).toBe( 0 );
        }
    } );

} );

