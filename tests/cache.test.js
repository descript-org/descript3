const de = require( '../lib' );

const { wait_for_value } = require( './helpers' );

describe( 'cache', () => {

    it( 'get', () => {
        const cache = new de.Cache();

        const key = 'KEY';

        const result = cache.get( { key } );
        expect( result ).toBe( undefined );
    } );

    it( 'set then get', () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        cache.set( { key, value } );

        const result = cache.get( { key } );
        expect( result ).toBe( value );
    } );

    it( 'set with max_age #1', async () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        const maxage = 100;
        cache.set( { key, value, maxage } );

        await wait_for_value( null, 50 );

        const result = cache.get( { key } );
        expect( result ).toBe( value );
    } );

    it( 'set with max_age #2', async () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        const maxage = 50;
        cache.set( { key, value, maxage } );

        await wait_for_value( null, 100 );

        const result = cache.get( { key } );
        expect( result ).toBe( undefined );
    } );

    it( 'set with max_age #3', async () => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        const maxage = 0;
        cache.set( { key, value, maxage } );

        await wait_for_value( null, 100 );

        const result = cache.get( { key } );
        expect( result ).toBe( value );
    } );

} );

