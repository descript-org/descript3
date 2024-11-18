export interface CacheInterface<Result> {
    get: ({ key }: { key: string }) => Promise<Result | undefined>;
    set: ({ key, value, maxage }: { key: string; value: Result; maxage?: number }) => Promise<void>;
}

// Simple basic implementation of in-memory cache
class Cache<Result> implements CacheInterface<Result> {
    protected cache: Record<string, {
        expires: number;
        value: Result;
    }>;

    constructor() {
        this.cache = {};
    }

    get({ key }: { key: string }): Promise<Result | undefined> {
        const cache = this.cache;

        const item = cache[ key ];

        if (item) {
            if ((item.expires === 0) || (Date.now() < item.expires)) {
                return Promise.resolve(item.value);
            }

            delete cache[ key ];
        }

        return Promise.resolve(undefined);
    }

    set({ key, value, maxage = 0 }: { key: string; value: Result; maxage?: number }): Promise<void> {
        this.cache[ key ] = {
            value: value,
            expires: (maxage) ? Date.now() + maxage : 0,
        };

        return Promise.resolve();
    }

}

export default Cache;
