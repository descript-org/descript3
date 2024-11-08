export type CacheItem<Result> = {
    expires: number;
    value: Result;
}


class Cache<Result, ItemType extends CacheItem<Result> = CacheItem<Result>> {
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

        return undefined;
    }

    async set({ key, value, maxage = 0 }: { key: string; value: Result; maxage?: number }): Promise<unknown> {
        this.cache[ key ] = {
            value: value,
            expires: (maxage) ? Date.now() + maxage : 0,
        } as ItemType ;

        return undefined;
    }

}

export default Cache;
