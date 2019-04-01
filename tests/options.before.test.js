const de = require( '../lib' );

const {
    wait_for_value,
    wait_for_error,
    get_result_block,
} = require( './helpers' );

describe( 'options.before', () => {

    it( 'before gets { params, context }', async () => {
        const spy = jest.fn();
        const block = get_result_block( null )( {
            options: {
                before: spy,
            },
        } );

        const params = {
            foo: 42,
        };
        const context = new de.Context();
        await context.run( block, params );

        const calls = spy.mock.calls;
        expect( calls[ 0 ][ 0 ].params ).toBe( params );
        expect( calls[ 0 ][ 0 ].context ).toBe( context );
    } );

    it.each( [ null, false, 0, '', 42, 'foo', {} ] )( 'before returns %j, action never called', async ( before_result ) => {
        const spy = jest.fn();
        const block = get_result_block( spy )( {
            options: {
                before: () => before_result,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( before_result );
        expect( spy.mock.calls.length ).toBe( 0 );
    } );

    it( 'before throws, action never called', async () => {
        const spy = jest.fn();
        const before_error = de.error( {
            id: 'SOME_ERROR',
        } );
        const block = get_result_block( spy )( {
            options: {
                before: () => {
                    throw before_error;
                },
            },
        } );

        expect.assertions( 2 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( before_error );
            expect( spy.mock.calls.length ).toBe( 0 );
        }
    } );

    it( 'before returns promise that rejects, action never called', async () => {
        const spy = jest.fn();
        const before_error = de.error( {
            id: 'SOME_ERROR',
        } );
        const block = get_result_block( spy )( {
            options: {
                before: () => wait_for_error( before_error, 50 ),
            },
        } );

        expect.assertions( 2 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( before_error );
            expect( spy.mock.calls.length ).toBe( 0 );
        }
    } );

    it( 'before returns promise that resolves, action never called', async () => {
        const spy = jest.fn();
        const before_result = {
            foo: 42,
        };
        const block = get_result_block( spy )( {
            options: {
                before: () => wait_for_value( before_result, 50 ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( before_result );
        expect( spy.mock.calls.length ).toBe( 0 );
    } );

    it( 'before returns undefined', async () => {
        const block_result = {
            foo: 42,
        };
        const block = get_result_block( block_result )( {
            options: {
                before: () => undefined,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( block_result );
    } );

    describe( 'inheritance', () => {

        it( 'child\'s first, parent\'s second', async () => {
            const spy = jest.fn();
            const parent = get_result_block( null )( {
                options: {
                    before: () => spy( 'PARENT' ),
                },
            } );
            const child = parent( {
                options: {
                    before: () => spy( 'CHILD' ),
                },
            } );

            const context = new de.Context();
            await context.run( child );

            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 2 );
            expect( calls[ 0 ][ 0 ] ).toBe( 'CHILD' );
            expect( calls[ 1 ][ 0 ] ).toBe( 'PARENT' );
        } );

        it.each( [ null, false, 0, '', 42, 'foo', {} ] )( 'child returns %j, parent never called', async ( child_before_result ) => {
            const spy = jest.fn();
            const parent = get_result_block( null )( {
                options: {
                    before: spy,
                },
            } );
            const child = parent( {
                options: {
                    before: () => child_before_result,
                },
            } );

            const context = new de.Context();
            const result = await context.run( child );

            expect( result ).toBe( child_before_result );
            expect( spy.mock.calls.length ).toBe( 0 );
        } );

        it.each( [ null, false, 0, '', 42, 'foo', {} ] )( 'child returns undefined, parent returns %j', async ( parent_before_result ) => {
            const parent = get_result_block( null )( {
                options: {
                    before: () => parent_before_result,
                },
            } );
            const child = parent( {
                options: {
                    before: () => undefined,
                },
            } );

            const context = new de.Context();
            const result = await context.run( child );

            expect( result ).toBe( parent_before_result );
        } );

        it( 'child returns undefined, parent returns undefined', async () => {
            const block_result = {
                foo: 42,
            };
            const parent = get_result_block( block_result )( {
                options: {
                    before: () => undefined,
                },
            } );
            const child = parent( {
                options: {
                    before: () => undefined,
                },
            } );

            const context = new de.Context();
            const result = await context.run( child );

            expect( result ).toBe( block_result );
        } );

        it( 'child returns undefined, parent throws', async () => {
            const parent_before_error = de.error( {
                id: 'SOME_ERROR',
            } );
            const parent = get_result_block( null )( {
                options: {
                    before: () => {
                        throw parent_before_error;
                    },
                },
            } );
            const child = parent( {
                options: {
                    before: () => undefined,
                },
            } );

            expect.assertions( 1 );
            try {
                const context = new de.Context();
                await context.run( child );

            } catch ( e ) {
                expect( e ).toBe( parent_before_error );
            }
        } );

        it( 'child throws, parent never called', async () => {
            const spy = jest.fn();
            const child_before_error = de.error( {
                id: 'SOME_ERROR',
            } );
            const parent = get_result_block( null )( {
                options: {
                    before: spy,
                },
            } );
            const child = parent( {
                options: {
                    before: () => {
                        throw child_before_error;
                    },
                },
            } );

            expect.assertions( 2 );
            try {
                const context = new de.Context();
                await context.run( child );

            } catch ( e ) {
                expect( e ).toBe( child_before_error );
                expect( spy.mock.calls.length ).toBe( 0 );
            }
        } );

    } );

} );

