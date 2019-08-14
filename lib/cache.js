class Cache {

    constructor() {
        this._cache = {};
    }

    get( key ) {
        const cache = this._cache;

        const item = cache[ key ];
        if ( item ) {
            if ( Date.now() < item.expires ) {
                return item.value;
            }

            delete cache[ key ];
        }
    }

    set( key, value, max_age ) {
        this._cache[ key ] = {
            value: value,
            expires: Date.now() + ( max_age * 1000 ),
        };
    }

}

module.exports = Cache;

