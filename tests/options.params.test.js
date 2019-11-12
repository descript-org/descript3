const de = require( '../lib' );

const {
    get_result_block,
} = require( './helpers' );

describe( 'options.params', () => {

    it( 'no params', async () => {
        const spy = jest.fn();
        const block = get_result_block( spy );

        await de.run( block );

        const calls = spy.mock.calls;
        expect( calls[ 0 ][ 0 ].params ).toStrictEqual( {} );
    } );

    describe( 'params is a function', () => {

        it( 'params gets { params, context }', async () => {
            const spy = jest.fn( () => ( {} ) );
            const block = get_result_block( null )( {
                options: {
                    params: spy,
                },
            } );

            const params = {
                id: 42,
            };
            const context = {
                context: true,
            };
            await de.run( block, { params, context } );

            const calls = spy.mock.calls;
            expect( calls[ 0 ][ 0 ].params ).toBe( params );
            expect( calls[ 0 ][ 0 ].context ).toBe( context );
        } );

        it( 'params gets { deps }', async () => {
            const spy = jest.fn();

            let data_foo;
            let id_foo;

            const block = de.func( {
                block: ( { generate_id } ) => {
                    data_foo = {
                        foo: 42,
                    };
                    id_foo = generate_id( 'foo' );

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
                },
            } );

            await de.run( block );

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

            expect.assertions( 3 );
            try {
                await de.run( block );

            } catch ( e ) {
                expect( de.is_error( e ) ).toBe( true );
                expect( e.error.id ).toBe( de.ERROR_ID.INVALID_OPTIONS_PARAMS );
                expect( spy.mock.calls.length ).toBe( 0 );
            }
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

            await de.run( block );

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
                await de.run( block );

            } catch ( e ) {
                expect( e ).toBe( error );
            }
        } );

    } );

    it( 'params is an object', async () => {
        const block = get_result_block( null )( {
            options: {
                params: {
                    foo: null,
                },
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.INVALID_OPTIONS_PARAMS );
        }
    } );

    describe( 'inheritance', () => {

        it( 'child first, then parent', async () => {
            let parent_params;
            const parent_spy = jest.fn( () => {
                parent_params = {
                    foo: 42,
                };
                return parent_params;
            } );

            let child_params;
            const child_spy = jest.fn( () => {
                child_params = {
                    bar: 24,
                };
                return child_params;
            } );

            const action_spy = jest.fn();

            const parent = get_result_block( action_spy )( {
                options: {
                    params: parent_spy,
                },
            } );
            const child = parent( {
                options: {
                    params: child_spy,
                },
            } );

            const params = {
                quu: 66,
            };
            await de.run( child, { params } );

            expect( child_spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
            expect( parent_spy.mock.calls[ 0 ][ 0 ].params ).toBe( child_params );
            expect( action_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params );
        } );

    } );

} );

