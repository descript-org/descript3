class Cache {

    constructor() {
        this._cache = {};
    }

    get( key ) {
        const cache = this._cache;

        const item = cache[ key ];
        if ( item ) {
            if ( ( item.expires === 0 ) || ( Date.now() < item.expires ) ) {
                return item.value;
            }

            delete cache[ key ];
        }
    }

    set( key, value, maxage = 0 ) {
        this._cache[ key ] = {
            value: value,
            expires: ( maxage ) ? Date.now() + maxage : 0,
        };
    }

}

module.exports = Cache;

