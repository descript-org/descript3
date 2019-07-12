const de = require( '../lib' );

const {
    get_result_block,
} = require( './helpers' );

describe( 'options.params', () => {

    it( 'no params', async () => {
        const spy = jest.fn();
        const block = get_result_block( spy );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;
        expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {} );
    } );

    describe( 'params is a function', () => {

        it( 'params gets { params, context }', async () => {
            const spy = jest.fn();
            const block = get_result_block( null )( {
                options: {
                    params: spy,
                },
            } );

            const params = {
                id: 42,
            };
            const context = new de.Context();
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toBe( params );
            expect( calls[ 0 ][ 0 ].context ).toBe( context );
        } );

        it( 'params gets { deps }', async () => {
            const spy = jest.fn();

            let data_foo;
            let id_foo;

            const block = function( get_id ) {
                data_foo = {
                    foo: 42,
                };
                id_foo = get_id( 'foo' );

                return de.object( {
                    block: {
                        foo: get_result_block( data_foo )( {
                            options: {
                                id: id_foo,
                            },
                        } ),

                        bar: get_result_block( null )( {
                            options: {
                                deps: id_foo,
                                params: spy,
                            },
                        } ),
                    },
                } );
            };

            const context = new de.Context();
            await context.run( block );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].deps[ id_foo ] ).toBe( data_foo );
        } );

        it.each( [ undefined, null, false, '', 0, 42 ] )( 'params returns %j', async ( params_result ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: () => params_result,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {} );
        } );

        it( 'params returns object, action gets it as { params }', async () => {
            const spy = jest.fn();

            let params;

            const block = get_result_block( spy )( {
                options: {
                    params: () => {
                        params = {
                            id: 42,
                        };

                        return params;
                    },
                },
            } );

            const context = new de.Context();
            await context.run( block );

            expect( spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
        } );

        it( 'params throws', async () => {
            const error = de.error( {
                id: 'SOME_ERROR',
            } );
            const block = get_result_block( null )( {
                options: {
                    params: () => {
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

    } );

    describe( 'params is an object', () => {

        it( 'params replaces passed params', async () => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        bar: 24,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: 42,
            };
            await context.run( block, params );
            await context.run( block, params );

            expect( spy.mock.calls[ 0 ][ 0 ].params ).toStrictEqual( {
                bar: 24,
            } );
            expect( spy.mock.calls[ 0 ][ 0 ].params ).not.toBe( spy.mock.calls[ 1 ][ 0 ].params );
        } );

        it.each( [ undefined, null, 0, false, '', 42 ] )( 'options.params property is undefined, params property is %j', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: undefined,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: value,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {} );
        } );

        it.each( [ null, 0, false, '', 42 ] )( 'options.params property is null, params property is %j', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: null,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: value,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: value,
            } );
        } );

        it( 'options.params property is null, params property is undefined', async () => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: null,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: undefined,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {} );
        } );

        it.each( [ false, 0, '', 42 ] )( 'options.params property is %j, params property is 0', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: value,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: 0,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: 0,
            } );
        } );

        it.each( [ false, 0, '', 42 ] )( 'options.params property is %j, params property is false', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: value,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: false,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: false,
            } );
        } );

        it.each( [ false, 0, '', 42 ] )( 'options.params property is %j, params property is ""', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: value,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: '',
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: '',
            } );
        } );

        it.each( [ false, 0, '', 42 ] )( 'options.params property is %j, params property is 24', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: value,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: 24,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: 24,
            } );
        } );

        it.each( [ false, 0, '', 42 ] )( 'options.params property is %j, params property is null', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: value,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: null,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: null,
            } );
        } );

        it.each( [ false, 0, '', 42 ] )( 'options.params property is %j, params property is undefined', async ( value ) => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: value,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: undefined,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {
                foo: value,
            } );
        } );

        describe( 'property is a function', () => {

            it( 'property gets { params, context }', async () => {
                const spy = jest.fn();
                const block = get_result_block( null )( {
                    options: {
                        params: {
                            foo: spy,
                        },
                    },
                } );

                const params = {
                    id: 42,
                };
                const context = new de.Context();
                await context.run( block, params );

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toBe( params );
                expect( calls[ 0 ][ 0 ].context ).toBe( context );
            } );

            it( 'property returns undefined', async () => {
                const spy = jest.fn();
                const block = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: () => undefined,
                        },
                    },
                } );

                const params = {
                    foo: 42,
                };
                const context = new de.Context();
                await context.run( block, params );

                const call_params = spy.mock.calls[ 0 ][ 0 ].params;
                expect( call_params ).toStrictEqual( {} );
                expect( 'foo' in call_params ).toBe( false );
            } );

            it.each( [ null, false, '', 0, 'Hello', 42 ] )( 'property returns %j', async ( value ) => {
                const spy = jest.fn();
                const block = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: () => value,
                        },
                    },
                } );

                const params = {
                    foo: 42,
                };
                const context = new de.Context();
                await context.run( block, params );

                const call_params = spy.mock.calls[ 0 ][ 0 ].params;
                expect( call_params ).toStrictEqual( {
                    foo: value,
                } );
            } );

            it( 'property throws', async () => {
                const params_error = de.error( {
                    id: 'SOME_ERROR',
                } );
                const block = get_result_block( null )( {
                    options: {
                        params: {
                            foo: () => {
                                throw params_error;
                            },
                        },
                    },
                } );

                expect.assertions( 1 );
                try {
                    const context = new de.Context();
                    await context.run( block );

                } catch ( e ) {
                    expect( e ).toBe( params_error );
                }
            } );

        } );

    } );

    describe( 'inheritance', () => {

        it.each( [ undefined, null, 42 ] )( 'parent returns %j', async ( value ) => {
            const params_spy = jest.fn();

            const parent = get_result_block()( {
                options: {
                    params: () => value,
                },
            } );
            const child = parent( {
                options: {
                    params: params_spy,
                },
            } );

            const params = {
                foo: 42,
            };
            const context = new de.Context();
            await context.run( child, params );

            expect( params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
        } );

        it( 'child is an object', async () => {
            const params_spy = jest.fn();

            let parent_params;
            const parent = get_result_block()( {
                options: {
                    params: () => {
                        parent_params = {
                            foo: 42,
                        };
                        return parent_params;
                    },
                },
            } );
            const child = parent( {
                options: {
                    params: {
                        bar: params_spy,
                    },
                },
            } );

            const context = new de.Context();
            await context.run( child );

            expect( params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params );
        } );

        it( 'child is a function', async () => {
            const params_spy = jest.fn();

            let parent_params;
            const parent = get_result_block()( {
                options: {
                    params: () => {
                        parent_params = {
                            foo: 42,
                        };
                        return parent_params;
                    },
                },
            } );
            const child = parent( {
                options: {
                    params: params_spy,
                },
            } );

            const context = new de.Context();
            await context.run( child );

            expect( params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params );
        } );

    } );

} );

