const de = require( '../lib' );

const {
    //  wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
    get_timeout,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'de.object', () => {

    it( 'two subblocks', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, get_timeout( 50, 100 ) );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

        const block = de.object( {
            block: {
                foo: block_foo,
                bar: block_bar,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toEqual( {
            foo: data_foo,
            bar: data_bar,
        } );
        expect( result.foo ).toBe( data_foo );
        expect( result.bar ).toBe( data_bar );
    } );

    it( 'two subblocks, one required', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, get_timeout( 50, 100 ) );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        required: true,
                    },
                } ),
                bar: block_bar,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toEqual( {
            foo: data_foo,
            bar: data_bar,
        } );
        expect( result.foo ).toBe( data_foo );
        expect( result.bar ).toBe( data_bar );
    } );

    it( 'two subblocks, one failed', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, get_timeout( 50, 100 ) );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

        const block = de.object( {
            block: {
                foo: block_foo,
                bar: block_bar,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.foo ).toBe( error_foo );
        expect( result.bar ).toBe( data_bar );
    } );

    it( 'two subblocks, both failed', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR_1',
        } );
        const block_foo = get_error_block( error_foo, get_timeout( 50, 100 ) );

        const error_bar = de.error( {
            id: 'SOME_ERROR_2',
        } );
        const block_bar = get_error_block( error_bar, get_timeout( 50, 100 ) );

        const block = de.object( {
            block: {
                foo: block_foo,
                bar: block_bar,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.foo ).toBe( error_foo );
        expect( result.bar ).toBe( error_bar );
    } );

    it( 'two subblocks, one required failed', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, get_timeout( 50, 100 ) );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

        const block = de.object( {
            block: {
                foo: block_foo( {
                    options: {
                        required: true,
                    },
                } ),
                bar: block_bar,
            },
        } );

        expect.assertions( 3 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
            expect( e.error.reason ).toBe( error_foo );
        }
    } );

    it( 'order of keys', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 100 );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, 50 );

        const block = de.object( {
            block: {
                foo: block_foo,
                bar: block_bar,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( Object.keys( result ) ).toEqual( [ 'foo', 'bar' ] );
    } );

    it( 'cancel #1', async () => {
        const action_foo_spy = jest.fn();
        const block_foo = get_result_block( null, 50, {
            on_cancel: action_foo_spy,
        } );

        const action_bar_spy = jest.fn();
        const block_bar = get_result_block( null, 150, {
            on_cancel: action_bar_spy,
        } );

        const block = de.object( {
            block: {
                foo: block_foo,
                bar: block_bar,
            },
        } );

        const abort_error = de.error( {
            id: 'SOME_ERROR',
        } );
        try {
            const context = new de.Context();
            setTimeout( () => {
                context.abort( abort_error );
            }, 100 );
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( abort_error );
            expect( action_foo_spy.mock.calls.length ).toBe( 0 );
            expect( action_bar_spy.mock.calls[ 0 ][ 0 ] ).toBe( abort_error );
        }
    } );

} );

