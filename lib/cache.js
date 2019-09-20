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

    set( key, value, max_age = 0 ) {
        this._cache[ key ] = {
            value: value,
            expires: ( max_age ) ? Date.now() + max_age : 0,
        };
    }

}

module.exports = Cache;

