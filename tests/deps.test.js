const de = require( '../lib' );

const {
    get_timeout,
    //  wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.deps', () => {

    test( 'block depends on block #1 (deps is id)', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), 50 );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );

        const id_foo = Symbol( 'foo' );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),
                bar: block_bar( {
                    options: {
                        deps: id_foo,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;

        expect( calls.length ).toBe( 2 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
    } );

    test( 'block depends on block #2 (deps is array)', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), 50 );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );

        const id_foo = Symbol( 'foo' );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),
                bar: block_bar( {
                    options: {
                        deps: [ id_foo ],
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;

        expect( calls.length ).toBe( 2 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
    } );

    test( 'block depends on block depends on block', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), 50 );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );
        const block_quu = get_result_block( () => spy( 'QUU' ), 50 );

        const id_foo = Symbol( 'foo' );
        const id_bar = Symbol( 'bar' );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),
                bar: block_bar( {
                    options: {
                        id: id_bar,
                        deps: id_foo,
                    },
                } ),
                quu: block_quu( {
                    options: {
                        deps: id_bar,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;

        expect( calls.length ).toBe( 3 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
        expect( calls[ 2 ][ 0 ] ).toBe( 'QUU' );
    } );

    test( 'block depends on two blocks', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), get_timeout( 50, 100 ) );
        const block_bar = get_result_block( () => spy( 'BAR' ), get_timeout( 50, 100 ) );
        const block_quu = get_result_block( () => spy( 'QUU' ), 50 );

        const id_foo = Symbol( 'foo' );
        const id_bar = Symbol( 'bar' );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),
                bar: block_bar( {
                    options: {
                        id: id_bar,
                    },
                } ),
                quu: block_quu( {
                    options: {
                        deps: [ id_foo, id_bar ],
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const calls = spy.mock.calls;

        expect( calls.length ).toBe( 3 );
        expect( calls[ 2 ][ 0 ] ).toBe( 'QUU' );
    } );

    test( 'failed deps #1', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, 50 );

        const body_bar = jest.fn();
        const block_bar = get_result_block( body_bar, 50 );

        const id_foo = Symbol( 'foo' );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),

                bar: block_bar( {
                    options: {
                        deps: id_foo,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.DEPS_ERROR );
        expect( result.bar.error.reason ).toBe( error_foo );
        expect( body_bar ).toHaveBeenCalledTimes( 0 );
    } );

    test( 'failed deps #2', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR_1',
        } );
        const block_foo = get_error_block( error_foo, 100 );

        const error_bar = de.error( {
            id: 'SOME_ERROR_2',
        } );
        const block_bar = get_error_block( error_bar, 50 );

        const body_quu = jest.fn();
        const block_quu = get_result_block( body_quu, 50 );

        const id_foo = Symbol( 'foo' );
        const id_bar = Symbol( 'bar' );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),

                bar: block_bar( {
                    options: {
                        id: id_bar,
                    },
                } ),

                quu: block_quu( {
                    options: {
                        deps: [ id_foo, id_bar ],
                    },
                } ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( de.is_error( result.quu ) ).toBe( true );
        expect( result.quu.error.id ).toBe( de.ERROR_ID.DEPS_ERROR );
        //  block_bar падает за 50 мс, а block_foo за 100 мс.
        //  Поэтому в reason будет error_bar.
        expect( result.quu.error.reason ).toBe( error_bar );
        expect( body_quu ).toHaveBeenCalledTimes( 0 );
    } );

    test( 'before( { deps } ) has deps results #1', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 50 );
        const block_bar = get_result_block( null, 50 );

        const id_foo = Symbol( 'foo' );
        const before_bar = jest.fn();

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),

                bar: block_bar( {
                    options: {
                        deps: id_foo,

                        before: before_bar,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const deps = before_bar.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( data_foo );
    } );

    test( 'before( { deps } ) has deps results #2', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 300 );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, 200 );

        const block_quu = get_result_block( null, 100 );

        const id_foo = Symbol( 'foo' );
        const id_bar = Symbol( 'bar' );
        const before_quu = jest.fn();

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),

                bar: block_bar( {
                    options: {
                        id: id_bar,
                    },
                } ),

                quu: block_quu( {
                    options: {
                        deps: [ id_foo, id_bar ],

                        before: before_quu,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const deps = before_quu.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( data_foo );
        expect( deps[ id_bar ] ).toBe( data_bar );
    } );

    test( 'before( { deps } ) has not results from other blocks', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 50 );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, 100 );

        const block_quu = get_result_block( null, 50 );

        const id_foo = Symbol( 'foo' );
        const id_bar = Symbol( 'bar' );
        const before_quu = jest.fn();

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        id: id_foo,
                    },
                } ),

                bar: block_bar( {
                    options: {
                        id: id_bar,
                    },
                } ),

                quu: block_quu( {
                    options: {
                        deps: id_bar,

                        before: before_quu,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        await context.run( block );

        const deps = before_quu.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( undefined );
        expect( deps[ id_bar ] ).toBe( data_bar );
    } );

    it( 'wait for result of de.func', async () => {
        const id_foo = Symbol( 'foo' );
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 50 )( {
            options: {
                id: id_foo,
            },
        } );

        const block_bar = get_result_block( block_foo, 50 );

        const before_quu = jest.fn();
        const block_quu = get_result_block( null, 50 );

        const block = de.object( {
            block: {
                bar: block_bar,

                quu: block_quu( {
                    options: {
                        deps: id_foo,

                        before: before_quu,
                    },
                } ),

            },
        } );

        const context = new de.Context();
        await context.run( block );

        const deps = before_quu.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( data_foo );
    } );

    it( 'unresolved deps #1', async () => {
        const id_foo = Symbol( 'foo' );

        const block = get_result_block( null, 50 )( {
            options: {
                deps: id_foo,
            },
        } );

        expect.assertions( 2 );

        const context = new de.Context();
        try {
            await context.run( block );

        } catch ( error ) {
            expect( de.is_error( error ) ).toBe( true );
            expect( error.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
        }
    } );

    it( 'unresolved deps #2', async () => {
        const block_foo = get_result_block( null, 50 );
        const block_bar = get_result_block( null, 50 );

        const foo_id = Symbol( 'foo' );

        const block = de.object( {
            block: {
                foo: block_foo,

                bar: block_bar( {
                    options: {
                        deps: foo_id,
                    },
                } ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
    } );

    it( 'preconditions #1', async () => {
        const state = {};

        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 50 );
        const block_bar = get_result_block( () => state.foo, 50 );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        after: function( { result } ) {
                            state.foo = result;
                        },
                    },
                } ),

                bar: block_bar( {
                    options: {
                        deps: [
                            () => Boolean( state.foo ),
                        ],
                    },
                } ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.bar ).toBe( data_foo );
    } );

    it( 'preconditions #2', async () => {
        const state = {};

        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, get_timeout( 50, 100 ) );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

        const block_quu = get_result_block( () => {
            return {
                foo: state.foo,
                bar: state.bar,
            };
        }, 50 );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        after: function( { result } ) {
                            state.foo = result;
                        },
                    },
                } ),

                bar: block_bar( {
                    options: {
                        after: function( { result } ) {
                            state.bar = result;
                        },
                    },
                } ),

                quu: block_quu( {
                    options: {
                        deps: [
                            () => Boolean( state.foo ),
                            () => Boolean( state.bar ),
                        ],
                    },
                } ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.quu ).toEqual( {
            foo: data_foo,
            bar: data_bar,
        } );
        expect( result.quu.foo ).toBe( data_foo );
        expect( result.quu.bar ).toBe( data_bar );
    } );

    it( 'preconditions #3', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( null, 50 );
        const block_bar = get_result_block( data_foo, 100 );

        const state = {};

        const block_quu = get_result_block( () => state.foo, 50 );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        after: function() {
                            state.foo = null;
                        },
                    },
                } ),

                bar: block_bar( {
                    options: {
                        after: function( { result } ) {
                            state.foo = result;
                        },
                    },
                } ),

                quu: block_quu( {
                    options: {
                        deps: () => Boolean( state.foo ),
                    },
                } ),
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.quu ).toBe( data_foo );
    } );

} );

