const de = require( '../lib' );

const {
    //  wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
    get_timeout,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'de.array', () => {

    it( 'empty array', async () => {
        const block = de.array( {
            block: [],
        } );

        const result = await de.run( block );

        expect( result ).toEqual( [] );
    } );


    it( 'two subblocks', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, get_timeout( 50, 100 ) );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

        const block = de.array( {
            block: [
                block_foo,
                block_bar,
            ],
        } );

        const result = await de.run( block );

        expect( result ).toEqual( [
            data_foo,
            data_bar,
        ] );
        expect( result[ 0 ] ).toBe( data_foo );
        expect( result[ 1 ] ).toBe( data_bar );
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

        const block = de.array( {
            block: [
                block_foo( {
                    options: {
                        required: true,
                    },
                } ),
                block_bar,
            ],
        } );

        const result = await de.run( block );

        expect( result ).toEqual( [
            data_foo,
            data_bar,
        ] );
        expect( result[ 0 ] ).toBe( data_foo );
        expect( result[ 1 ] ).toBe( data_bar );
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

        const block = de.array( {
            block: [
                block_foo,
                block_bar,
            ],
        } );

        const result = await de.run( block );

        expect( result[ 0 ] ).toBe( error_foo );
        expect( result[ 1 ] ).toBe( data_bar );
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

        const block = de.array( {
            block: [
                block_foo,
                block_bar,
            ],
        } );

        const result = await de.run( block );

        expect( result[ 0 ] ).toBe( error_foo );
        expect( result[ 1 ] ).toBe( error_bar );
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

        const block = de.array( {
            block: [
                block_foo( {
                    options: {
                        required: true,
                    },
                } ),
                block_bar,
            ],
        } );

        expect.assertions( 3 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
            expect( e.error.reason ).toBe( error_foo );
        }
    } );

    describe( 'cancel', () => {

        it( 'cancel object, subblocks cancelled too #1', async () => {
            const action_foo_spy = jest.fn();
            const block_foo = get_result_block( null, 150, {
                on_cancel: action_foo_spy,
            } );

            const action_bar_spy = jest.fn();
            const block_bar = get_result_block( null, 150, {
                on_cancel: action_bar_spy,
            } );

            const block = de.array( {
                block: [
                    block_foo,
                    block_bar,
                ],
            } );

            const abort_error = de.error( {
                id: 'SOME_ERROR',
            } );
            try {
                const cancel = new de.Cancel();
                setTimeout( () => {
                    cancel.cancel( abort_error );
                }, 100 );
                await de.run( block, { cancel } );

            } catch ( e ) {
                expect( e ).toBe( abort_error );
                expect( action_foo_spy.mock.calls[ 0 ][ 0 ] ).toBe( abort_error );
                expect( action_bar_spy.mock.calls[ 0 ][ 0 ] ).toBe( abort_error );
            }
        } );

        it( 'cancel object, subblocks cancelled too #2', async () => {
            const action_foo_spy = jest.fn();
            const block_foo = get_result_block( null, 50, {
                on_cancel: action_foo_spy,
            } );

            const action_bar_spy = jest.fn();
            const block_bar = get_result_block( null, 150, {
                on_cancel: action_bar_spy,
            } );

            const block = de.array( {
                block: [
                    block_foo,
                    block_bar,
                ],
            } );

            const abort_error = de.error( {
                id: 'SOME_ERROR',
            } );
            try {
                const cancel = new de.Cancel();
                setTimeout( () => {
                    cancel.cancel( abort_error );
                }, 100 );
                await de.run( block, { cancel } );

            } catch ( e ) {
                expect( e ).toBe( abort_error );
                expect( action_foo_spy.mock.calls.length ).toBe( 0 );
                expect( action_bar_spy.mock.calls[ 0 ][ 0 ] ).toBe( abort_error );
            }
        } );

        it( 'required block failed, other subblocks cancelled', async () => {
            const error_foo = de.error( {
                id: 'SOME_ERROR',
            } );
            const block_foo = get_error_block( error_foo, 50 );

            const action_bar_spy = jest.fn();
            const block_bar = get_result_block( null, 150, {
                on_cancel: action_bar_spy,
            } );

            const block = de.array( {
                block: [
                    block_foo( {
                        options: {
                            required: true,
                        },
                    } ),
                    block_bar,
                ],
            } );

            try {
                await de.run( block );

            } catch ( e ) {
                const call_0_0 = action_bar_spy.mock.calls[ 0 ][ 0 ];
                expect( de.is_error( call_0_0 ) ).toBe( true );
                expect( call_0_0.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
                expect( call_0_0.error.reason ).toBe( error_foo );
            }
        } );

    } );

    describe( 'priority', () => {

        it( 'two blocks, one with priority', async () => {
            const spy = jest.fn();
            const block_foo = get_result_block( () => spy( 'ACTION_FOO' ), 50 );
            const block_bar = get_result_block( () => spy( 'ACTION_BAR' ), 100 );

            const block = de.array( {
                block: [
                    block_foo( {
                        options: {
                            before: () => spy( 'BEFORE_FOO' ),
                            after: () => spy( 'AFTER_FOO' ),
                        },
                    } ),

                    block_bar( {
                        options: {
                            priority: 10,
                            before: () => spy( 'BEFORE_BAR' ),
                            after: () => spy( 'AFTER_BAR' ),
                        },
                    } ),
                ],
            } );

            await de.run( block );

            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 6 );
            expect( calls[ 0 ][ 0 ] ).toBe( 'BEFORE_BAR' );
            expect( calls[ 1 ][ 0 ] ).toBe( 'ACTION_BAR' );
            expect( calls[ 2 ][ 0 ] ).toBe( 'AFTER_BAR' );
            expect( calls[ 3 ][ 0 ] ).toBe( 'BEFORE_FOO' );
            expect( calls[ 4 ][ 0 ] ).toBe( 'ACTION_FOO' );
            expect( calls[ 5 ][ 0 ] ).toBe( 'AFTER_FOO' );
        } );

        it( 'three blocks, two with the same priority', async () => {
            const spy = jest.fn();
            const block_foo = get_result_block( () => spy( 'FOO' ), get_timeout( 50, 100 ) );
            const block_bar = get_result_block( () => spy( 'BAR' ), get_timeout( 50, 100 ) );
            const block_quu = get_result_block( () => spy( 'QUU' ), get_timeout( 50, 100 ) );

            const block = de.array( {
                block: [
                    block_foo,

                    block_bar( {
                        options: {
                            priority: 10,
                        },
                    } ),

                    block_quu( {
                        options: {
                            priority: 10,
                        },
                    } ),
                ],
            } );

            await de.run( block );

            const calls = spy.mock.calls;
            expect( calls.length ).toBe( 3 );
            expect( [ 'BAR', 'QUU' ] ).toContain( calls[ 0 ][ 0 ] );
            expect( [ 'BAR', 'QUU' ] ).toContain( calls[ 1 ][ 0 ] );
            expect( calls[ 0 ][ 0 ] ).not.toBe( calls[ 1 ][ 0 ] );
            expect( calls[ 2 ][ 0 ] ).toBe( 'FOO' );
        } );

    } );

} );

