const de = require( '../lib' );

const { wait_for_value } = require( './helpers' );

describe( 'cache', () => {

    it( 'get', () => {
        const cache = new de.Cache();

        const key = 'KEY';

        const result = cache.get( key );
        expect( result ).toBe( undefined );
    } );

    it( 'set then get', () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        cache.set( key, value );

        const result = cache.get( key );
        expect( result ).toBe( value );
    } );

    it( 'set with max_age #1', async () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        cache.set( key, value, 100 );

        await wait_for_value( null, 50 );

        const result = cache.get( key );
        expect( result ).toBe( value );
    } );

    it( 'set with max_age #2', async () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        cache.set( key, value, 50 );

        await wait_for_value( null, 100 );

        const result = cache.get( key );
        expect( result ).toBe( undefined );
    } );

    it( 'set with max_age #3', async () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        cache.set( key, value, 0 );

        await wait_for_value( null, 100 );

        const result = cache.get( key );
        expect( result ).toBe( value );
    } );

} );

