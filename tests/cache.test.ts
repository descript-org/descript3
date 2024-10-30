import * as de from '../lib';

import { waitForValue } from './helpers';


describe('cache', () => {

    it('get', async() => {
        const cache = new de.Cache();

        const key = 'KEY';

        const result = await cache.get({ key });
        expect(result).toBeUndefined();
    });

    it('set then get', async() => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        await cache.set({ key, value });

        const result = await cache.get({ key });
        expect(result).toBe(value);
    });

    it('set with max_age #1', async() => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        const maxage = 100;
        await cache.set({ key, value, maxage });

        await waitForValue(null, 50);

        const result = await cache.get({ key });
        expect(result).toBe(value);
    });

    it('set with max_age #2', async() => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        const maxage = 50;
        await cache.set({ key, value, maxage });

        await waitForValue(null, 100);

        const result = await cache.get({ key });
        expect(result).toBeUndefined();
    });

    it('set with max_age #3', async() => {
        const cache = new de.Cache();

        const key = 'KEY';
        const value = {
            foo: 42,
        };
        const maxage = 0;
        await cache.set({ key, value, maxage });

        await waitForValue(null, 100);

        const result = await cache.get({ key });
        expect(result).toBe(value);
    });

});
