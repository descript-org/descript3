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

    it( 'two subblocks, one required failed #1', async () => {
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

        expect.assertions( 4 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
            expect( e.error.reason ).toBe( error_foo );
            expect( e.error.path ).toBe( '[ 0 ]' );
        }
    } );

    it( 'two subblocks, one required failed #2', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, get_timeout( 50, 100 ) );
        const block_bar = get_result_block( null, get_timeout( 50, 100 ) );
        const block_quu = get_result_block( null, get_timeout( 50, 100 ) );

        const block = de.array( {
            block: [
                de.object( {
                    block: {
                        foo: block_foo( {
                            options: {
                                required: true,
                            },
                        } ),
                        bar: block_bar,
                    },

                    options: {
                        required: true,
                    },
                } ),
                block_quu,
            ],
        } );

        expect.assertions( 3 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
            expect( e.error.path ).toBe( '[ 0 ].foo' );
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

    describe( 'inheritance', () => {

        it( 'two subblocks', async () => {
            const data_foo = {
                foo: 42,
            };
            const block_foo = get_result_block( data_foo, get_timeout( 50, 100 ) );

            const data_bar = {
                bar: 24,
            };
            const block_bar = get_result_block( data_bar, get_timeout( 50, 100 ) );

            const parent = de.array( {
                block: [
                    block_foo,
                    block_bar,
                ],
            } );
            const child = parent();

            const result = await de.run( child );

            expect( result ).toEqual( [
                data_foo,
                data_bar,
            ] );
            expect( result[ 0 ] ).toBe( data_foo );
            expect( result[ 1 ] ).toBe( data_bar );
        } );

    } );

} );

