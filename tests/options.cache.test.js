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

    get( key ) {
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

    set( key, value, maxage ) {
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

    it( 'second run from cache', async () => {
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

        const context_1 = new de.Context();
        const result_1 = await context_1.run( block );

        await wait_for_value( null, 100 );

        const context_2 = new de.Context();
        const result_2 = await context_2.run( block );

        expect( result_1 ).toBe( block_value );
        expect( result_2 ).toBe( block_value );
        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    it( 'cache expired, real second run', async () => {
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

        const context_1 = new de.Context();
        await context_1.run( block );

        await wait_for_value( null, 100 );

        const context_2 = new de.Context();
        await context_2.run( block );

        expect( spy.mock.calls.length ).toBe( 2 );
    } );

} );

