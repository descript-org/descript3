const de = require( '../lib' );

const {
    //  wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.deps', () => {

    test( 'failed deps #1', async () => {
        const id_foo = Symbol( 'foo' );
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, 300 );

        const body_bar = jest.fn();
        const block_bar = de.func( {
            block: body_bar,
        } );

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
        const id_foo = Symbol( 'foo' );
        const error_foo = de.error( {
            id: 'SOME_ERROR_1',
        } );
        const block_foo = get_error_block( error_foo, 300 );

        const id_bar = Symbol( 'bar' );
        const error_bar = de.error( {
            id: 'SOME_ERROR_2',
        } );
        const block_bar = get_error_block( error_bar, 100 );

        const body_quu = jest.fn();
        const block_quu = de.func( {
            block: body_quu,
        } );

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
        //  block_bar падает за 100 мс, а block_foo за 300 мс.
        //  Поэтому в reason будет error_bar.
        expect( result.quu.error.reason ).toBe( error_bar );
        expect( body_quu ).toHaveBeenCalledTimes( 0 );
    } );

    test( 'before( { deps } ) has deps results #1', async () => {
        const id_foo = Symbol( 'foo' );
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 300 );

        const block_bar = get_result_block( null, 200 );
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
        const id_foo = Symbol( 'foo' );
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 300 );

        const id_bar = Symbol( 'bar' );
        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, 200 );

        const before_quu = jest.fn();
        const block_quu = get_result_block( null, 100 );

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

    it( 'wait for result of de.func', async () => {
        const id_foo = Symbol( 'foo' );
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 300 )( {
            options: {
                id: id_foo,
            },
        } );

        const block_bar = get_result_block( block_foo, 200 );

        const before_quu = jest.fn();
        const block_quu = get_result_block( null );

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

} );

