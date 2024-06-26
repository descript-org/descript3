const de = require( '../lib' );

const {
    get_timeout,
    wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.deps', () => {

    it( 'block with id and without deps', async () => {
        const data = {
            foo: 42,
        };
        const id = Symbol( 'block' );
        const block = get_result_block( data, 50 )( {
            options: {
                id: id,
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( data );
    } );

    it( 'no options.deps, deps is empty object', async () => {
        const spy = jest.fn();
        const block = de.func( {
            block: spy,
        } );

        await de.run( block );
        expect( spy.mock.calls[ 0 ][ 0 ].deps ).toEqual( {} );
    } );

    it( 'empty deps', async () => {
        const data = {
            foo: 42,
        };
        const block = get_result_block( data, 50 )( {
            options: {
                deps: [],
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( data );
    } );

    it( 'failed block with id and without deps', async () => {
        const error = de.error( {
            id: 'ERROR',
        } );
        const id = Symbol( 'block' );
        const block = get_error_block( error, 50 )( {
            options: {
                id: id,
            },
        } );

        expect.assertions( 1 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

    it( 'block with invalid deps id #1', async () => {
        const data = {
            foo: 42,
        };
        const id = Symbol( 'block' );
        const block = get_result_block( data, 50 )( {
            options: {
                deps: id,
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.INVALID_DEPS_ID );
        }
    } );

    it( 'block with invalid deps id #2', async () => {
        const data = {
            foo: 42,
        };
        const block = de.func( {
            block: () => {
                const id = Symbol( 'block' );
                return get_result_block( data, 50 )( {
                    options: {
                        deps: id,
                    },
                } );
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.INVALID_DEPS_ID );
        }
    } );

    it( 'block depends on block #1 (deps is id)', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), 50 );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const calls = spy.mock.calls;

        expect( calls ).toHaveLength( 2 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
    } );

    it( 'block depends on block #2 (deps is array)', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), 50 );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const calls = spy.mock.calls;

        expect( calls ).toHaveLength( 2 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
    } );

    it( 'block depends on block depends on block', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), 50 );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );
        const block_quu = get_result_block( () => spy( 'QUU' ), 50 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();
                const id_bar = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const calls = spy.mock.calls;

        expect( calls ).toHaveLength( 3 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
        expect( calls[ 2 ][ 0 ] ).toBe( 'QUU' );
    } );

    it( 'block depends on two blocks', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), get_timeout( 50, 100 ) );
        const block_bar = get_result_block( () => spy( 'BAR' ), get_timeout( 50, 100 ) );
        const block_quu = get_result_block( () => spy( 'QUU' ), 50 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();
                const id_bar = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const calls = spy.mock.calls;

        expect( calls ).toHaveLength( 3 );
        expect( calls[ 2 ][ 0 ] ).toBe( 'QUU' );
    } );

    it( 'two block depend on block', async () => {
        const spy = jest.fn();

        const block_foo = get_result_block( () => spy( 'FOO' ), get_timeout( 50, 100 ) );
        const block_bar = get_result_block( () => spy( 'BAR' ), 50 );
        const block_quu = get_result_block( () => spy( 'QUU' ), 100 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
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
                        quu: block_quu( {
                            options: {
                                deps: id_foo,
                            },
                        } ),
                    },
                } );
            },
        } );

        await de.run( block );

        const calls = spy.mock.calls;

        expect( calls ).toHaveLength( 3 );
        expect( calls[ 0 ][ 0 ] ).toBe( 'FOO' );
        expect( calls[ 1 ][ 0 ] ).toBe( 'BAR' );
        expect( calls[ 2 ][ 0 ] ).toBe( 'QUU' );
    } );

    it( 'failed deps #1', async () => {
        const error_foo = de.error( {
            id: 'SOME_ERROR',
        } );
        const block_foo = get_error_block( error_foo, 50 );

        const body_bar = jest.fn();
        const block_bar = get_result_block( body_bar, 50 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
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
            },
        } );

        const result = await de.run( block );

        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.DEPS_ERROR );
        expect( result.bar.error.reason ).toBe( error_foo );
        expect( body_bar ).toHaveBeenCalledTimes( 0 );
    } );

    it( 'failed deps #2', async () => {
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

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();
                const id_bar = generate_id();

                return de.object( {
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
            },
        } );

        const result = await de.run( block );

        expect( de.is_error( result.quu ) ).toBe( true );
        expect( result.quu.error.id ).toBe( de.ERROR_ID.DEPS_ERROR );
        //  block_bar падает за 50 мс, а block_foo за 100 мс.
        //  Поэтому в reason будет error_bar.
        expect( result.quu.error.reason ).toBe( error_bar );
        expect( body_quu ).toHaveBeenCalledTimes( 0 );
    } );

    it( 'deps not resolved #1', async () => {
        const block_foo = get_result_block( null, 50 );
        const block_bar = get_result_block( null, 100 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
                    block: {
                        foo: block_foo,

                        bar: block_bar( {
                            options: {
                                deps: id_foo,
                            },
                        } ),
                    },
                } );
            },
        } );

        const result = await de.run( block );

        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
    } );

    it( 'deps not resolved #2', async () => {
        const block_foo = get_result_block( null, 50 );
        const block_bar = get_result_block( null, 100 );

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
                    block: {
                        foo: block_foo,

                        bar: block_bar( {
                            options: {
                                deps: id_foo,
                            },
                        } ),
                    },
                } );
            },
        } );

        const result = await de.run( block );

        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
    } );

    it( 'one block with deps', async () => {
        const block = de.func( {
            block: ( { generate_id } ) => {
                const id = generate_id();

                return get_result_block( null, 50 )( {
                    options: {
                        deps: id,
                    },
                } );
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
        }
    } );

    it( 'block returns another block that depends on parent block', async () => {
        const block = de.func( {
            block: ( { generate_id } ) => {
                const id = generate_id();

                const child = get_result_block( null, 50 )( {
                    options: {
                        deps: id,
                    },
                } );

                return get_result_block( child, 50 )( {
                    options: {
                        id: id,
                    },
                } );
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
        }


    } );

    it( 'before( { deps } ) has deps results #1', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 50 );
        const block_bar = get_result_block( null, 50 );

        const before_bar = jest.fn();

        let id_foo;
        const block = de.func( {
            block: ( { generate_id } ) => {
                id_foo = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const deps = before_bar.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( data_foo );
    } );

    it( 'before( { deps } ) has deps results #2', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 300 );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, 200 );

        const block_quu = get_result_block( null, 100 );

        const before_quu = jest.fn();

        let id_foo;
        let id_bar;
        const block = de.func( {
            block: ( { generate_id } ) => {
                id_foo = generate_id();
                id_bar = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const deps = before_quu.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( data_foo );
        expect( deps[ id_bar ] ).toBe( data_bar );
    } );

    it( 'before( { deps } ) has not results from other blocks', async () => {
        const data_foo = {
            foo: 42,
        };
        const block_foo = get_result_block( data_foo, 50 );

        const data_bar = {
            bar: 24,
        };
        const block_bar = get_result_block( data_bar, 100 );

        const block_quu = get_result_block( null, 50 );

        const before_quu = jest.fn();

        let id_foo;
        let id_bar;
        const block = de.func( {
            block: ( { generate_id } ) => {
                id_foo = generate_id();
                id_bar = generate_id();

                return de.object( {
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
            },
        } );

        await de.run( block );

        const deps = before_quu.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( undefined );
        expect( deps[ id_bar ] ).toBe( data_bar );
    } );

    it( 'wait for result of de.func', async () => {
        const before_quu = jest.fn();

        let data_foo;
        let id_foo;

        const block = de.func( {
            block: ( { generate_id } ) => {
                id_foo = generate_id();

                data_foo = {
                    foo: 42,
                };

                return de.object( {
                    block: {
                        bar: get_result_block( () => {
                            return get_result_block( data_foo, 50 )( {
                                options: {
                                    id: id_foo,
                                },
                            } );
                        }, 50 ),

                        quu: get_result_block( null, 50 )( {
                            options: {
                                deps: id_foo,

                                before: before_quu,
                            },
                        } ),
                    },
                } );
            },
        } );

        await de.run( block );

        const deps = before_quu.mock.calls[ 0 ][ 0 ].deps;
        expect( deps[ id_foo ] ).toBe( data_foo );
    } );

    it( 'result of de.func has deps #1', async () => {
        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
                    block: {
                        foo: get_result_block( null, 50 )( {
                            options: {
                                id: id_foo,
                            },
                        } ),

                        bar: de.func( {
                            block: () => {
                                return new Promise( ( resolve ) => {
                                    setTimeout( () => {
                                        resolve( get_result_block( null, 50 )( {
                                            options: {
                                                deps: id_foo,
                                            },
                                        } ) );
                                    }, 100 );
                                } );
                            },
                        } ),
                    },
                } );
            },
        } );

        const result = await de.run( block );

        expect( result ).toEqual( { foo: null, bar: null } );

    } );

    it( 'result of de.func has deps #2', async () => {
        let error_foo;

        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_foo = generate_id();

                return de.object( {
                    block: {
                        foo: de.func( {
                            block: async () => {
                                await wait_for_value( null, 50 );

                                error_foo = de.error( {
                                    id: 'ERROR',
                                } );
                                throw error_foo;
                            },
                            options: {
                                id: id_foo,
                            },
                        } ),

                        bar: de.func( {
                            block: async () => {
                                await wait_for_value( null, 50 );

                                return get_result_block( null, 50 )( {
                                    options: {
                                        deps: id_foo,
                                    },
                                } );
                            },
                        } ),
                    },
                } );
            },
        } );

        const result = await de.run( block );

        expect( result.foo ).toBe( error_foo );
        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.DEPS_ERROR );
        expect( result.bar.error.reason ).toBe( error_foo );
    } );

    it.each( [ 'foo', Symbol( 'foo' ) ] )( 'unresolved deps #1, id is %p', async ( id ) => {
        const block = get_result_block( null, 50 )( {
            options: {
                deps: id,
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( error ) {
            expect( de.is_error( error ) ).toBe( true );
            expect( error.error.id ).toBe( de.ERROR_ID.INVALID_DEPS_ID );
        }
    } );

    it.each( [ 'foo', Symbol( 'foo' ) ] )( 'unresolved deps #2, id is %p', async ( id ) => {
        const block_foo = get_result_block( null, 50 );
        const block_bar = get_result_block( null, 50 );

        const block = de.object( {
            block: {
                foo: block_foo,

                bar: block_bar( {
                    options: {
                        deps: id,
                    },
                } ),
            },
        } );

        const result = await de.run( block );

        expect( de.is_error( result.bar ) ).toBe( true );
        expect( result.bar.error.id ).toBe( de.ERROR_ID.INVALID_DEPS_ID );
    } );

    it( 'fix 3.0.19', async () => {
        const block = de.func( {
            block: ( { generate_id } ) => {
                const id_a = generate_id();
                const id_c = generate_id();

                return de.object( {
                    block: {
                        A: get_error_block( () => de.error( {
                            id: 'ERROR_A',
                        } ), 50 )( {
                            options: {
                                id: id_a,
                            },
                        } ),

                        //  Вот этот блок падает из-за A, n_active_blocks при этом не инкрементился,
                        //  но в конце декрементился. В итоге n_active_blocks разъезжался и уходил в минус.
                        //
                        B: get_result_block( null, 50 )( {
                            options: {
                                deps: id_a,
                            },
                        } ),

                        C: get_result_block( null, 200 )( {
                            options: {
                                id: id_c,
                            },
                        } ),

                        //  Этот блок зависит от C, но когда B падает из-за блока A,
                        //  неправильно декрементился счетчик n_active_blocks и D решал, что
                        //  зависимости не сходятся. Короче, какая-то Санта Барбара.
                        //
                        D: get_result_block( null, 50 )( {
                            options: {
                                deps: id_c,
                                required: true,
                            },
                        } ),
                    },
                } );
            },
        } );

        const r = await de.run( block );

        expect( r.D ).toBe( null );
    } );

    describe( 'de.pipe', () => {

        it( 'second block in pipe depends of the first one', async () => {
            let result_bar;
            const block = de.func( {
                block: ( { generate_id } ) => {
                    const id_foo = generate_id();
                    const block_foo = get_result_block( null, 50 )( {
                        options: {
                            id: id_foo,
                        },
                    } );

                    result_bar = {
                        bar: 24,
                    };
                    const block_bar = get_result_block( result_bar, 50 )( {
                        options: {
                            deps: id_foo,
                        },
                    } );

                    return de.pipe( {
                        block: [ block_foo, block_bar ],
                    } );
                },
            } );

            const result = await de.run( block );

            expect( result ).toBe( result_bar );
        } );

        it( 'first block in pipe depends of the second one', async () => {
            const block = de.func( {
                block: ( { generate_id } ) => {
                    const id_bar = generate_id();

                    const block_foo = get_result_block( null, 50 )( {
                        options: {
                            deps: id_bar,
                        },
                    } );
                    const block_bar = get_result_block( null, 50 )( {
                        options: {
                            deps: id_bar,
                        },
                    } );

                    return de.pipe( {
                        block: [ block_foo, block_bar ],
                    } );
                },
            } );

            expect.assertions( 2 );
            try {
                await de.run( block );

            } catch ( e ) {
                expect( de.is_error( e ) ).toBe( true );
                expect( e.error.id ).toBe( de.ERROR_ID.DEPS_NOT_RESOLVED );
            }
        } );

    } );

} );

