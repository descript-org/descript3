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
            const spy = jest.fn();
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

            const block = function( { generate_id } ) {
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
            };

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

            await de.run( block );

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
            await de.run( child, { params } );

            expect( params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
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

            await de.run( child );

            expect( params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params );
        } );

    } );

} );

