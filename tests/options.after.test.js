const de = require( '../lib' );

const {
    wait_for_value,
    wait_for_error,
    get_result_block,
} = require( './helpers' );

describe( 'options.after', () => {

    it( 'after gets { params, context, result }', async () => {
        const spy = jest.fn();
        const block_result = {
            foo: 42,
        };
        const block = get_result_block( block_result )( {
            options: {
                after: spy,
            },
        } );

        const params = {
            bar: 24,
        };
        const context = new de.Context();
        await context.run( block, params );

        const calls = spy.mock.calls;
        expect( calls[ 0 ][ 0 ].params ).toBe( params );
        expect( calls[ 0 ][ 0 ].context ).toBe( context );
        expect( calls[ 0 ][ 0 ].result ).toBe( block_result );
    } );

    it.each( [ null, false, 0, '', 42, 'foo', {} ] )( 'after returns %j', async ( after_result ) => {
        const block_result = {
            foo: 42,
        };
        const block = get_result_block( block_result )( {
            options: {
                after: () => after_result,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( after_result );
    } );

    it( 'after returns undefined', async () => {
        const block_result = {
            foo: 42,
        };
        const block = get_result_block( block_result )( {
            options: {
                after: () => undefined,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( block_result );
    } );

    it( 'after throws', async () => {
        const after_error = de.error( {
            id: 'SOME_ERROR',
        } );
        const block = get_result_block( null )( {
            options: {
                after: () => {
                    throw after_error;
                },
            },
        } );

        expect.assertions( 1 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( after_error );
        }
    } );

    it( 'after returns promise that resolves', async () => {
        const after_result = {
            foo: 42,
        };
        const block = get_result_block( null )( {
            options: {
                after: () => wait_for_value( after_result, 50 ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( after_result );
    } );

    it( 'after returns promise that rejects', async () => {
        const after_error = de.error( {
            id: 'SOME_ERROR',
        } );
        const block = get_result_block( null )( {
            options: {
                after: () => wait_for_error( after_error, 50 ),
            },
        } );

        expect.assertions( 1 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( after_error );
        }
    } );

    describe( 'inheritance', () => {

        it( 'parent\'s first, child\'s second', async () => {
            const spy = jest.fn();
            const parent = get_result_block( null )( {
                options: {
                    after: () => spy( 'PARENT' ),
                },
            } );
            const child = parent( {
                options: {
                    after: () => spy( 'CHILD' ),
                },
            } );

            const context = new de.Context();
            await context.run( child );

            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 2 );
            expect( calls[ 0 ][ 0 ] ).toBe( 'PARENT' );
            expect( calls[ 1 ][ 0 ] ).toBe( 'CHILD' );
        } );

        it( 'parent throws, child never called', async () => {
            const spy = jest.fn();
            const parent_after_error = de.error( {
                id: 'SOME_ERROR',
            } );
            const parent = get_result_block( null )( {
                options: {
                    after: () => {
                        throw parent_after_error;
                    },
                },
            } );
            const child = parent( {
                options: {
                    after: spy,
                },
            } );

            expect.assertions( 2 );
            try {
                const context = new de.Context();
                await context.run( child );

            } catch ( e ) {
                expect( e ).toBe( parent_after_error );
                expect( spy.mock.calls.length ).toBe( 0 );
            }
        } );

        it( 'child throws', async () => {
            const parent_after_result = {
                foo: 42,
            };
            const child_after_error = de.error( {
                id: 'SOME_ERROR',
            } );
            const parent = get_result_block( null )( {
                options: {
                    after: () => parent_after_result,
                },
            } );
            const child = parent( {
                options: {
                    after: () => {
                        throw child_after_error;
                    },
                },
            } );

            expect.assertions( 1 );
            try {
                const context = new de.Context();
                await context.run( child );

            } catch ( e ) {
                expect( e ).toBe( child_after_error );
            }
        } );

        it( 'parent returns undefined, child gets action result in { result }', async () => {
            const spy = jest.fn();
            const block_result = {
                foo: 42,
            };
            const parent = get_result_block( block_result )( {
                options: {
                    after: () => undefined,
                },
            } );
            const child = parent( {
                options: {
                    after: spy,
                },
            } );

            const context = new de.Context();
            await context.run( child );

            expect( spy.mock.calls[ 0 ][ 0 ].result ).toBe( block_result );
        } );

        it.each( [ null, false, 0, '', 42, 'foo', {} ] )( 'parent returns %j, child gets parent\'s result in { result }', async ( value ) => {
            const spy = jest.fn( () => value );
            const parent_after_result = {
                foo: 42,
            };
            const parent = get_result_block( null )( {
                options: {
                    after: () => parent_after_result,
                },
            } );
            const child = parent( {
                options: {
                    after: spy,
                },
            } );

            const context = new de.Context();
            const result = await context.run( child );

            expect( result ).toBe( value );
            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].result ).toBe( parent_after_result );
        } );

        it( 'child gets parent\'s result in { result } and returns undefined', async () => {
            const spy = jest.fn( () => undefined );

            const parent_after_result = {
                foo: 42,
            };
            const parent = get_result_block( null )( {
                options: {
                    after: () => parent_after_result,
                },
            } );
            const child = parent( {
                options: {
                    after: spy,
                },
            } );

            const context = new de.Context();
            const result = await context.run( child );

            expect( result ).toBe( parent_after_result );
            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].result ).toBe( parent_after_result );
        } );

        it.each( [ null, false, 0, '', 42, 'foo', {} ] )( 'child returns %j', async ( child_after_result ) => {
            const block_result = {
                foo: 42,
            };
            const parent_after_result = {
                bar: 24,
            };
            const parent = get_result_block( block_result )( {
                options: {
                    after: () => parent_after_result,
                },
            } );
            const child = parent( {
                options: {
                    after: () => child_after_result,
                },
            } );

            const context = new de.Context();
            const result = await context.run( child );

            expect( result ).toBe( child_after_result );
        } );

    } );

} );

