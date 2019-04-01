const de = require( '../lib' );

const {
    get_result_block,
} = require( './helpers' );

describe( 'options.params', () => {

    it( 'no params', async () => {
        const spy = jest.fn();
        const block = get_result_block( spy )( {
            options: {
                params: undefined,
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;
        expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {} );
    } );

    describe( 'params is a function', () => {

        it( 'params gets { params, context }', async () => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
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

        it.each( [ undefined, null, false, '', 0 ] )( 'params returns %j', async ( params_result ) => {
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
            const block_params = {
                id: 42,
            };
            const block = get_result_block( spy )( {
                options: {
                    params: () => {
                        return block_params;
                    },
                },
            } );

            const context = new de.Context();
            await context.run( block );

            expect( spy.mock.calls[ 0 ][ 0 ].params ).toBe( block_params );
        } );

        it( 'params throws', async () => {
            const params_error = de.error( {
                id: 'SOME_ERROR',
            } );
            const block = get_result_block( null )( {
                options: {
                    params: () => {
                        throw params_error;
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

    describe( 'params is an object', () => {

        it( 'params extends passed params #1', async () => {
            const spy = jest.fn();
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        foo: 42,
                    },
                },
            } );

            const context = new de.Context();
            const params = {};
            await context.run( block, params );

            expect( spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
        } );

        it( 'params extends passed params #2', async () => {
            const spy = jest.fn();
            const value_bar = Symbol( 'bar' );
            const block = get_result_block( spy )( {
                options: {
                    params: {
                        bar: value_bar,
                    },
                },
            } );

            const context = new de.Context();
            const params = {
                foo: 42,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toEqual( {
                foo: 42,
                bar: value_bar,
            } );
        } );

        it( 'property is undefined', async () => {
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
                foo: 42,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toEqual( {
                foo: 42,
            } );
        } );

        it.each( [ null, false, 0, '' ] )( 'property is %j', async ( value ) => {
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
                foo: 42,
            };
            await context.run( block, params );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toEqual( {
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

            it( 'property returns value', async () => {
                const spy = jest.fn();
                const value_foo = Symbol( 'foo' );
                const block = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: () => value_foo,
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block );

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
                    foo: value_foo,
                } );
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

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
                    foo: 42,
                } );
            } );

            it.each( [ null, false, '', 0 ] )( 'property returns %j', async ( value ) => {
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

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
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

        describe( 'parent is an object, child is an object', () => {

            it( 'properties are values', async () => {
                const spy = jest.fn();
                const parent_foo_value = Symbol( 'parent_foo' );
                const parent_bar_value = Symbol( 'parent_bar' );
                const parent = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: parent_foo_value,
                            bar: parent_bar_value,
                        },
                    },
                } );
                const child_foo_value = Symbol( 'child_foo' );
                const child_quu_value = Symbol( 'child_quu' );
                const child = parent( {
                    options: {
                        params: {
                            foo: child_foo_value,
                            quu: child_quu_value,
                        },
                    },
                } );

                const params = {
                    foo: 42,
                    bar: 24,
                    quu: 66,
                    boo: 39,
                };
                const context = new de.Context();
                await context.run( child, params );

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toBe( params );
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
                    foo: child_foo_value,
                    bar: parent_bar_value,
                    quu: child_quu_value,
                    boo: 39,
                } );
            } );

            it( 'properties are undefined', async () => {
                const spy = jest.fn();
                const parent = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: undefined,
                            bar: undefined,
                        },
                    },
                } );
                const child = parent( {
                    options: {
                        params: {
                            foo: undefined,
                            quu: undefined,
                        },
                    },
                } );

                const params = {
                    foo: 42,
                    bar: 24,
                    quu: 66,
                    boo: 39,
                };
                const context = new de.Context();
                await context.run( child, params );

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toBe( params );
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
                    foo: 42,
                    bar: 24,
                    quu: 66,
                    boo: 39,
                } );
            } );

            it( 'parent properties are values, child properties are undefined', async () => {
                const spy = jest.fn();
                const parent_foo_value = Symbol( 'parent_foo' );
                const parent_bar_value = Symbol( 'parent_bar' );
                const parent = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: parent_foo_value,
                            bar: parent_bar_value,
                        },
                    },
                } );
                const child = parent( {
                    options: {
                        params: {
                            foo: undefined,
                            quu: undefined,
                        },
                    },
                } );

                const params = {
                    foo: 42,
                    bar: 24,
                    quu: 66,
                    boo: 39,
                };
                const context = new de.Context();
                await context.run( child, params );

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toBe( params );
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
                    foo: parent_foo_value,
                    bar: parent_bar_value,
                    quu: 66,
                    boo: 39,
                } );
            } );

            it( 'parent properties are undefined, child properties are values', async () => {
                const spy = jest.fn();
                const parent = get_result_block( spy )( {
                    options: {
                        params: {
                            foo: undefined,
                            bar: undefined,
                        },
                    },
                } );
                const child_foo_value = Symbol( 'child_foo' );
                const child_quu_value = Symbol( 'child_quu' );
                const child = parent( {
                    options: {
                        params: {
                            foo: child_foo_value,
                            quu: child_quu_value,
                        },
                    },
                } );

                const params = {
                    foo: 42,
                    bar: 24,
                    quu: 66,
                    boo: 39,
                };
                const context = new de.Context();
                await context.run( child, params );

                const calls = spy.mock.calls;
                expect( calls[ 0 ][ 0 ].params ).toBe( params );
                expect( calls[ 0 ][ 0 ].params ).toEqual( {
                    foo: child_foo_value,
                    bar: 24,
                    quu: child_quu_value,
                    boo: 39,
                } );
            } );

            describe( 'properties are functions', () => {

                it( 'parent returns value, child returns value', async () => {
                    const spy = jest.fn();
                    const parent_foo_value = Symbol( 'parent_foo' );
                    const parent = get_result_block( spy )( {
                        options: {
                            params: {
                                foo: () => parent_foo_value,
                            },
                        },
                    } );
                    const child_foo_value = Symbol( 'child_foo' );
                    const child = parent( {
                        options: {
                            params: {
                                foo: () => child_foo_value,
                            },
                        },
                    } );

                    const params = {
                        foo: 42,
                    };
                    const context = new de.Context();
                    await context.run( child, params );

                    const calls = spy.mock.calls;
                    expect( calls[ 0 ][ 0 ].params ).toBe( params );
                    expect( calls[ 0 ][ 0 ].params ).toEqual( {
                        foo: child_foo_value,
                    } );
                } );

                it( 'parent returns undefined, child returns value', async () => {
                    const spy = jest.fn();
                    const parent = get_result_block( spy )( {
                        options: {
                            params: {
                                foo: () => undefined,
                            },
                        },
                    } );
                    const child_foo_value = Symbol( 'child_foo' );
                    const child = parent( {
                        options: {
                            params: {
                                foo: () => child_foo_value,
                            },
                        },
                    } );

                    const params = {
                        foo: 42,
                    };
                    const context = new de.Context();
                    await context.run( child, params );

                    const calls = spy.mock.calls;
                    expect( calls[ 0 ][ 0 ].params ).toBe( params );
                    expect( calls[ 0 ][ 0 ].params ).toEqual( {
                        foo: child_foo_value,
                    } );
                } );

                it( 'parent returns value, child returns undefined', async () => {
                    const spy = jest.fn();
                    const parent_foo_value = Symbol( 'parent_foo' );
                    const parent = get_result_block( spy )( {
                        options: {
                            params: {
                                foo: () => parent_foo_value,
                            },
                        },
                    } );
                    const child = parent( {
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
                    await context.run( child, params );

                    const calls = spy.mock.calls;
                    expect( calls[ 0 ][ 0 ].params ).toBe( params );
                    expect( calls[ 0 ][ 0 ].params ).toEqual( {
                        foo: parent_foo_value,
                    } );
                } );

                it( 'parent returns undefined, child returns undefined', async () => {
                    const spy = jest.fn();
                    const parent = get_result_block( spy )( {
                        options: {
                            params: {
                                foo: () => undefined,
                            },
                        },
                    } );
                    const child = parent( {
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
                    await context.run( child, params );

                    const calls = spy.mock.calls;
                    expect( calls[ 0 ][ 0 ].params ).toBe( params );
                    expect( calls[ 0 ][ 0 ].params ).toEqual( {
                        foo: 42,
                    } );
                } );

            } );

        } );

        describe( 'parent is a function, child is a function', () => {

            it( 'parent\'s first, child\'s second', async () => {
                const action_spy = jest.fn();
                const parent_params_result = {
                    foo: 42,
                };
                const parent_params_spy = jest.fn( () => parent_params_result );
                const parent = get_result_block( action_spy )( {
                    options: {
                        params: parent_params_spy,
                    },
                } );
                const child_params_result = {
                    bar: 24,
                };
                const child_params_spy = jest.fn( () => child_params_result );
                const child = parent( {
                    options: {
                        params: child_params_spy,
                    },
                } );

                const params = {
                    quu: 66,
                };
                const context = new de.Context();
                await context.run( child, params );

                expect( parent_params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
                expect( child_params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params_result );
                expect( action_spy.mock.calls[ 0 ][ 0 ].params ).toBe( child_params_result );
            } );

            it.each( [ undefined, null, false, '', 0 ] )( 'parent returns %j', async ( parent_params_result ) => {
                const action_spy = jest.fn();
                const parent = get_result_block( action_spy )( {
                    options: {
                        params: () => parent_params_result,
                    },
                } );
                const child_params_result = {
                    bar: 24,
                };
                const child_params_spy = jest.fn( () => child_params_result );
                const child = parent( {
                    options: {
                        params: child_params_spy,
                    },
                } );

                const params = {
                    quu: 66,
                };
                const context = new de.Context();
                await context.run( child, params );

                expect( child_params_spy.mock.calls[ 0 ][ 0 ].params ).toEqual( {} );
                expect( action_spy.mock.calls[ 0 ][ 0 ].params ).toBe( child_params_result );
            } );

            it.each( [ undefined, null, false, '', 0 ] )( 'child returns %j', async ( child_params_result ) => {
                const action_spy = jest.fn();
                const parent_params_result = {
                    foo: 42,
                };
                const parent_params_spy = jest.fn( () => parent_params_result );
                const parent = get_result_block( action_spy )( {
                    options: {
                        params: parent_params_spy,
                    },
                } );
                const child = parent( {
                    options: {
                        params: () => child_params_result,
                    },
                } );

                const params = {
                    quu: 66,
                };
                const context = new de.Context();
                await context.run( child, params );

                expect( parent_params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
                expect( action_spy.mock.calls[ 0 ][ 0 ].params ).toEqual( {} );
            } );

        } );

    } );

} );

