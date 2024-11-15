export type CacheItem<Result> = {
    expires: number;
    value: Result;
}

export interface CacheInterface<Result> {
    get: ({ key }: { key: string }) => Promise<Result | undefined>;
    set: ({ key, value, maxage }: { key: string; value: Result; maxage?: number }) => Promise<void>;
}

class Cache<Result, ItemType extends CacheItem<Result> = CacheItem<Result>> implements CacheInterface<Result> {
    protected cache: Record<string, ItemType>;

    constructor() {
        this.cache = {};
    }

    async get({ key }: { key: string }): Promise<Result | undefined> {
        const cache = this.cache;

        const item = cache[ key ];

        if (item) {
            if ((item.expires === 0) || (Date.now() < item.expires)) {
                return item.value;
            }

            delete cache[ key ];
        }

        return;
    }

    async set({ key, value, maxage = 0 }: { key: string; value: Result; maxage?: number }): Promise<void> {
        this.cache[ key ] = {
            value: value,
            expires: (maxage) ? Date.now() + maxage : 0,
        } as ItemType ;

        return;
    }

}

export default Cache;
