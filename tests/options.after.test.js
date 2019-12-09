const de = require( '../lib' );

const {
    wait_for_value,
    wait_for_error,
    get_result_block,
    get_error_block,
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
        const context = {
            context: true,
        };
        await de.run( block, { params, context } );

        const calls = spy.mock.calls;
        expect( calls[ 0 ][ 0 ].params ).toBe( params );
        expect( calls[ 0 ][ 0 ].context ).toBe( context );
        expect( calls[ 0 ][ 0 ].result ).toBe( block_result );
    } );

    it( 'after never called if block errors', async () => {
        const block_error = de.error( {
            id: 'ERROR',
        } );
        const spy = jest.fn();
        const block = get_error_block( block_error, 50 )( {
            options: {
                after: spy,
            },
        } );

        try {
            await de.run( block );

        } catch ( e ) {
            expect( spy.mock.calls.length ).toBe( 0 );
        }
    } );

    it.each( [ null, false, 0, '', 42, 'foo', {}, undefined ] )( 'after returns %j', async ( after_result ) => {
        const block_result = {
            foo: 42,
        };
        const spy = jest.fn( () => after_result );
        const block = get_result_block( block_result )( {
            options: {
                after: spy,
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( after_result );
        expect( spy.mock.calls.length ).toBe( 1 );
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
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( after_error );
        }
    } );

    it( 'after throws, error returns value', async () => {
        let error_result;
        const spy_error = jest.fn( () => {
            error_result = {
                bar: 24,
            };
            return error_result;
        } );

        let after_error;
        const block = get_result_block( null, 50 )( {
            options: {
                after: () => {
                    after_error = de.error( {
                        id: 'ERROR',
                    } );
                    throw after_error;
                },
                error: spy_error,
            },
        } );

        const result = await de.run( block );

        expect( spy_error.mock.calls[ 0 ][ 0 ].error ).toBe( after_error );
        expect( result ).toBe( error_result );
    } );

    it( 'after returns error', async () => {
        const after_error = de.error( {
            id: 'AFTER_ERROR',
        } );
        const block = get_result_block( null )( {
            options: {
                after: () => after_error,
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( after_error );
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

        const result = await de.run( block );

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
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( after_error );
        }
    } );

    it( 'after returns promise that rejects, block has deps', async () => {
        let bar_result;

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id = generate_id();

                return de.object( {
                    block: {
                        foo: get_result_block( null, 50 )( {
                            options: {
                                id: id,
                            },
                        } ),

                        bar: get_result_block( null, 50 )( {
                            options: {
                                deps: id,
                                after: () => {
                                    return new Promise( ( resolve ) => {
                                        setTimeout( () => {
                                            bar_result = {
                                                bar: 24,
                                            };
                                            resolve( bar_result );
                                        }, 50 );
                                    } );
                                },
                            },
                        } ),
                    },
                } );
            },
        } );

        const r = await de.run( block );

        expect( r.bar ).toBe( bar_result );
    } );

    it( 'after returns recursive block', async () => {
        const factorial = de.func( {
            block: () => 1,
            options: {
                after: ( { params } ) => {
                    if ( params.n === 1 ) {
                        return {
                            r: params.r,
                        };

                    } else {
                        return factorial( {
                            options: {
                                params: ( { params } ) => {
                                    return {
                                        n: params.n - 1,
                                        r: ( params.r || 1 ) * params.n,
                                    };
                                },
                            },
                        } );
                    }
                },
            },
        } );

        const params = {
            n: 5,
        };
        const result = await de.run( factorial, { params } );
        expect( result.r ).toBe( 120 );
    } );

    it( 'cancelled during after', async () => {
        const error = de.error( {
            id: 'ERROR',
        } );
        const spy = jest.fn( () => wait_for_value( null, 100 ) );
        const block = get_result_block( null )( {
            options: {
                after: spy,
            },
        } );
        const cancel = new de.Cancel();
        setTimeout( () => {
            cancel.cancel( error );
        }, 50 );

        expect.assertions( 2 );
        try {
            await de.run( block, { cancel } );

        } catch ( e ) {
            expect( e ).toBe( error );
            expect( spy.mock.calls.length ).toBe( 1 );
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

            await de.run( child );

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
                await de.run( child );

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
                await de.run( child );

            } catch ( e ) {
                expect( e ).toBe( child_after_error );
            }
        } );

        it.each( [ null, false, 0, '', 42, 'foo', {}, undefined ] )( 'parent returns %j, child gets parent\'s result in { result }', async ( value ) => {
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

            const result = await de.run( child );

            expect( result ).toBe( value );
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

            const result = await de.run( child );

            expect( result ).toBe( child_after_result );
        } );

    } );

} );

