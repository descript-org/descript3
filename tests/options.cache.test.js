const de = require( '../lib' );

const {
    wait_for_value,
    //  wait_for_error,
    get_result_block,
    //  get_error_block,
    get_timeout,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

class Cache {

    constructor() {
        this.cache = {};
    }

    get( { key, context } ) {
        return new Promise( ( resolve ) => {
            const timeout = get_timeout( 0, 10 );

            setTimeout( () => {
                const cached = this.cache[ key ];
                let value;
                if ( cached && !( ( cached.maxage > 0 ) && ( Date.now() - cached.timestamp > cached.maxage ) ) ) {
                    value = cached.value;
                }
                resolve( value );
            }, timeout );
        } );
    }

    set( { key, value, maxage, context } ) {
        return new Promise( ( resolve ) => {
            const timeout = get_timeout( 0, 10 );
            setTimeout( () => {
                this.cache[ key ] = {
                    timestamp: Date.now(),
                    maxage: maxage,
                    value: value,
                };
                resolve();
            }, timeout );
        } );
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.cache, options.key, options.maxage', () => {

    it( 'key is garbage #1', async () => {
        const cache = new Cache();

        const block_value = Symbol();
        const spy = jest.fn( () => block_value );
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                //  Все, что не строка и не функция, должно игнорироваться.
                key: 42,
                maxage: 10000,
            },
        } );

        const result_1 = await de.run( block );
        await wait_for_value( null, 100 );
        const result_2 = await de.run( block );

        expect( result_1 ).toBe( block_value );
        expect( result_2 ).toBe( block_value );
        expect( spy.mock.calls.length ).toBe( 2 );

    } );

    it( 'key is garbage #2', async () => {
        const cache = new Cache();

        const block_value = Symbol();
        const spy = jest.fn( () => block_value );
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                //  Все, что не строка и не функция, должно игнорироваться.
                key: () => 42,
                maxage: 10000,
            },
        } );

        const result_1 = await de.run( block );
        await wait_for_value( null, 100 );
        const result_2 = await de.run( block );

        expect( result_1 ).toBe( block_value );
        expect( result_2 ).toBe( block_value );
        expect( spy.mock.calls.length ).toBe( 2 );

    } );

    it( 'key is a function, second run from cache', async () => {
        const cache = new Cache();

        const block_value = Symbol();
        const spy = jest.fn( () => block_value );
        const key = 'KEY';
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                key: () => key,
                maxage: 10000,
            },
        } );

        const result_1 = await de.run( block );

        await wait_for_value( null, 100 );

        const result_2 = await de.run( block );

        expect( result_1 ).toBe( block_value );
        expect( result_2 ).toBe( block_value );
        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    it( 'key is a function, cache expired, real second run', async () => {
        const cache = new Cache();

        const block_value = Symbol();
        const spy = jest.fn( () => block_value );
        const key = 'KEY';
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                key: () => key,
                maxage: 50,
            },
        } );

        await de.run( block );

        await wait_for_value( null, 100 );

        await de.run( block );

        expect( spy.mock.calls.length ).toBe( 2 );
    } );

    it( 'key is a function and returns undefined', async () => {
        const spy = jest.fn();
        const cache = {
            get: spy,
        };

        const data = {
            foo: 42,
        };
        const block = get_result_block( data, 50 )( {
            options: {
                cache: cache,
                key: () => undefined,
                maxage: 100,
            },
        } );

        const result = await de.run( block );

        expect( spy.mock.calls.length ).toBe( 0 );
        expect( result ).toBe( data );
    } );

    it( 'key is a string, second run from cache', async () => {
        const cache = new Cache();

        const block_value = Symbol();
        const spy = jest.fn( () => block_value );
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        } );

        const result_1 = await de.run( block );

        await wait_for_value( null, 100 );

        const result_2 = await de.run( block );

        expect( result_1 ).toBe( block_value );
        expect( result_2 ).toBe( block_value );
        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    it( 'cache.get throws', async () => {
        const cache = {
            get: () => {
                throw de.error( {
                    id: 'SOME_ERROR',
                } );
            },
            set: () => undefined,
        };
        const spy = jest.fn( () => null );
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        } );

        await de.run( block );

        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    it( 'cache.get returns promise that rejects, block has deps', async () => {
        const cache = {
            get: () => {
                return new Promise( ( resolve, reject ) => {
                    setTimeout( () => {
                        reject( de.error( {
                            id: 'SOME_ERROR',
                        } ) );
                    }, 50 );
                } );
            },
            set: () => undefined,
        };
        const spy = jest.fn( () => null );
        const block = de.func( {
            block: ( { generate_id } ) => {
                const id = generate_id();

                return de.object( {
                    block: {
                        foo: get_result_block( null, 50 )( {
                            options: {
                                id: id,
                            },
                        } ),

                        bar: get_result_block( spy, 50 )( {
                            options: {
                                deps: id,
                                cache: cache,
                                key: 'KEY',
                                maxage: 10000,
                            },
                        } ),
                    },
                } );
            },
        } );

        const r = await de.run( block );

        expect( r ).toEqual( { foo: null, bar: null } );
        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    it( 'cache.set throws', async () => {
        const cache = {
            get: () => undefined,
            set: () => {
                throw de.error( {
                    id: 'SOME_ERROR',
                } );
            },
        };
        const block = get_result_block( null, 50 )( {
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        } );

        await de.run( block );
    } );

    it( 'cache.get returns rejected promise', async () => {
        const cache = {
            get: () => {
                return Promise.reject( de.error( {
                    id: 'SOME_ERROR',
                } ) );
            },
            set: () => undefined,
        };
        const spy = jest.fn( () => null );
        const block = get_result_block( spy, 50 )( {
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        } );

        await de.run( block );

        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    it( 'cache.set returns rejected promise', async () => {
        const cache = {
            get: () => undefined,
            set: () => {
                return Promise.reject( de.error( {
                    id: 'SOME_ERROR',
                } ) );
            },
        };
        const block = get_result_block( null, 50 )( {
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        } );

        await de.run( block );
    } );

} );

