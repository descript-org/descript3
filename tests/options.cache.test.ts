import * as de from '../lib';

import { getResultBlock, getTimeout, waitForValue } from './helpers';

type CacheItem<Result> = {
    expires: number;
    maxage: number;
    value: Result;
    timestamp: number;
}
class Cache<Result> implements de.CacheInterface<Result> {
    #cache: Record<string, CacheItem<Result>> = {};

    get({ key }: { key: string }): Promise<Result | undefined> {
        return new Promise((resolve) => {
            const timeout = getTimeout(0, 10);

            setTimeout(() => {
                const cached = this.#cache[ key ];
                let value;
                if (cached && !((cached.maxage > 0) && (Date.now() - cached.timestamp > cached.maxage))) {
                    value = cached.value;
                }
                resolve(value);
            }, timeout);
        });
    }

    set({ key, value, maxage = 0 }: { key: string; value: Result; maxage?: number }) {
        return new Promise<void>((resolve) => {
            const timeout = getTimeout(0, 10);
            setTimeout(() => {
                this.#cache[ key ] = {
                    timestamp: Date.now(),
                    maxage: maxage,
                    value: value,
                    expires: 0,
                };
                resolve();
            }, timeout);
        });
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

describe('options.cache, options.key, options.maxage', () => {

    it('key is garbage #1', async() => {
        const cache = new Cache();

        const blockValue = Symbol();
        const spy = jest.fn<typeof blockValue, any>(() => blockValue);// as () => typeof blockValue;
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                maxage: 10000,
            },
        });

        const result1 = await de.run(block);
        await waitForValue(null, 100);
        const result2 = await de.run(block);

        expect(result1).toBe(blockValue);
        expect(result2).toBe(blockValue);
        expect(spy.mock.calls).toHaveLength(2);

    });

    it('key is garbage #2', async() => {
        const cache = new Cache();

        const blockValue = Symbol();
        const spy = jest.fn(() => blockValue);
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                maxage: 10000,
            },
        });

        const result1 = await de.run(block);
        await waitForValue(null, 100);
        const result2 = await de.run(block);

        expect(result1).toBe(blockValue);
        expect(result2).toBe(blockValue);
        expect(spy.mock.calls).toHaveLength(2);

    });

    it('key is a function, second run from cache', async() => {
        const cache = new Cache();

        const blockValue = Symbol();
        const spy = jest.fn(() => blockValue);
        const key = 'KEY';
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                key: () => key,
                maxage: 10000,
            },
        });

        const result1 = await de.run(block);

        await waitForValue(null, 100);

        const result2 = await de.run(block);

        expect(result1).toBe(blockValue);
        expect(result2).toBe(blockValue);
        expect(spy.mock.calls).toHaveLength(1);
    });

    it('key is a function, cache expired, real second run', async() => {
        const cache = new Cache();

        const blockValue = Symbol();
        const spy = jest.fn(() => blockValue);
        const key = 'KEY';
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                key: () => key,
                maxage: 50,
            },
        });

        await de.run(block);

        await waitForValue(null, 100);

        await de.run(block);

        expect(spy.mock.calls).toHaveLength(2);
    });

    it('key is a function and returns undefined', async() => {
        const spy = jest.fn();

        const data = {
            foo: 42,
        };

        const cache = new Cache();
        cache.get = spy;

        const block = getResultBlock(data, 50).extend({
            options: {
                cache: cache,
                maxage: 100,
            },
        });

        const result = await de.run(block);

        expect(spy.mock.calls).toHaveLength(0);
        expect(result).toBe(data);
    });

    it('key is a string, second run from cache', async() => {
        const cache = new Cache();

        const blockValue = Symbol();
        const spy = jest.fn(() => blockValue);
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        });

        const result1 = await de.run(block);

        await waitForValue(null, 100);

        const result2 = await de.run(block);

        expect(result1).toBe(blockValue);
        expect(result2).toBe(blockValue);
        expect(spy.mock.calls).toHaveLength(1);
    });

    it('cache.get throws', async() => {
        const cache = new Cache();
        cache.get = () => {
            throw de.error('SOME_ERROR3');
        };
        cache.set = () => {
            return Promise.resolve(undefined);
        };

        const spy = jest.fn(() => null);
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        });

        await de.run(block);

        expect(spy.mock.calls).toHaveLength(1);
    });

    it('cache.get returns promise that rejects, block has deps', async() => {
        const cache = new Cache();
        cache.get = () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(de.error('SOME_ERROR4'));
                }, 50);
            });
        };
        cache.set = () => {
            return Promise.resolve(undefined);
        };

        const spy = jest.fn(() => null);

        const block = de.func({
            block: ({ generateId }) => {
                const id = generateId();

                return de.object({
                    block: {
                        foo: getResultBlock(null, 50).extend({
                            options: {
                                id: id,
                            },
                        }),

                        bar: getResultBlock(spy, 50).extend({
                            options: {
                                deps: id,
                                cache: cache,
                                key: 'KEY',
                                maxage: 10000,
                            },
                        }),
                    },
                });
            },
        });

        const r = await de.run(block);

        expect(r).toEqual({ foo: null, bar: null });
        expect(spy.mock.calls).toHaveLength(1);
    });

    it('cache.set throws', async() => {
        const cache = new Cache();
        cache.get = () => {
            return Promise.resolve(undefined);
        };
        cache.set = () => {
            throw de.error('SOME_ERROR5');
        };

        const block = getResultBlock(null, 50).extend({
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        });

        await expect(async() => {
            await de.run(block);
        }).not.toThrow();
    });

    it('cache.get returns rejected promise', async() => {
        const cache = new Cache();
        cache.get = () => {
            return Promise.reject(de.error('SOME_ERROR1'));
        };
        cache.set = () => {
            return Promise.resolve(undefined);
        };

        const spy = jest.fn(() => null);
        const block = getResultBlock(spy, 50).extend({
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        });

        await de.run(block);

        expect(spy.mock.calls).toHaveLength(1);
    });

    it('cache.set returns rejected promise', async() => {
        const cache = new Cache();
        cache.get = () => {
            return Promise.resolve(undefined);
        };
        cache.set = () => {
            return Promise.reject(de.error('SOME_ERROR2'));
        };

        const block = getResultBlock(null, 50).extend({
            options: {
                cache: cache,
                key: 'KEY',
                maxage: 10000,
            },
        });

        await expect(async() => {
            await de.run(block);
        }).not.toThrow();
    });

});
