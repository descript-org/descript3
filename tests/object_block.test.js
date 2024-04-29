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

    it( 'block is undefined #1', () => {
        expect.assertions( 2 );
        try {
            de.object( {
                block: undefined,
            } );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.INVALID_BLOCK );
        }
    } );

    it( 'block is undefined #2', () => {
        expect.assertions( 2 );
        try {
            de.object();

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.INVALID_BLOCK );
        }
    } );

    it( 'empty object', async () => {
        const block = de.object( {
            block: {},
        } );

        const result = await de.run( block );

        expect( result ).toEqual( {} );
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

        const block = de.object( {
            block: {
                foo: block_foo,
                bar: block_bar,
            },
        } );

        const result = await de.run( block );

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

        const result = await de.run( block );

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

        const result = await de.run( block );

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

        const result = await de.run( block );

        expect( result.foo ).toBe( error_foo );
        expect( result.bar ).toBe( error_bar );
    } );

    it( 'two subblocks, one required failed #1', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, get_timeout( 50, 100 ) );
        const block_bar = get_result_block( null, get_timeout( 50, 100 ) );

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

        expect.assertions( 4 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
            expect( e.error.reason ).toBe( error_foo );
            expect( e.error.path ).toBe( '.foo' );
        }
    } );

    it( 'two subblocks, one required failed #2', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, get_timeout( 50, 100 ) );
        const block_bar = get_result_block( null, get_timeout( 50, 100 ) );
        const block_quu = get_result_block( null, get_timeout( 50, 100 ) );

        const block = de.object( {
            block: {
                foo: de.array( {
                    block: [
                        block_foo( {
                            options: {
                                required: true,
                            },
                        } ),
                        block_bar,
                    ],
                    options: {
                        required: true,
                    },
                } ),
                quu: block_quu,
            },
        } );

        expect.assertions( 3 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
            expect( e.error.path ).toBe( '.foo[ 0 ]' );
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

        const result = await de.run( block );

        expect( Object.keys( result ) ).toEqual( [ 'foo', 'bar' ] );
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
                const cancel = new de.Cancel();
                setTimeout( () => {
                    cancel.cancel( abort_error );
                }, 100 );
                await de.run( block );

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
                const cancel = new de.Cancel();
                setTimeout( () => {
                    cancel.cancel( abort_error );
                }, 100 );
                await de.run( block );

            } catch ( e ) {
                expect( e ).toBe( abort_error );
                expect( action_foo_spy.mock.calls ).toHaveLength( 0 );
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

            try {
                await de.run( block );

            } catch ( e ) {
                const call_0_0 = action_bar_spy.mock.calls[ 0 ][ 0 ];
                expect( de.is_error( call_0_0 ) ).toBe( true );
                expect( call_0_0.error.id ).toBe( de.ERROR_ID.REQUIRED_BLOCK_FAILED );
                expect( call_0_0.error.reason ).toBe( error_foo );
            }
        } );

        it( 'nested subblock cancels all', async () => {

            let cancel_reason;

            const block = de.object( {
                block: {
                    foo: de.object( {
                        block: {
                            bar: get_result_block()( {
                                options: {
                                    after: ( { cancel } ) => {
                                        cancel_reason = de.error( {
                                            id: 'ERROR',
                                        } );
                                        cancel.cancel( cancel_reason );
                                    },
                                },
                            } ),
                        },
                    } ),
                },
            } );

            expect.assertions( 1 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( error ).toBe( cancel_reason );
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

            const parent = de.object( {
                block: {
                    foo: block_foo,
                    bar: block_bar,
                },
            } );
            const child = parent();

            const result = await de.run( child );

            expect( result ).toEqual( {
                foo: data_foo,
                bar: data_bar,
            } );
            expect( result.foo ).toBe( data_foo );
            expect( result.bar ).toBe( data_bar );
        } );

    } );

} );

