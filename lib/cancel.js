const { create_error } = require( './error' );

class Cancel {

    constructor() {
        this._reason = null;
        this._closed = false;
        this._callbacks = [];
    }

    cancel( reason ) {
        if ( this._reason || this._closed ) {
            return;
        }

        reason = this._reason = create_error( reason );

        process.nextTick( () => {
            this._callbacks.forEach( ( callback ) => callback( reason ) );
        } );
    }

    close() {
        this._closed = true;
        this._callbacks = null;
    }

    throw_if_cancelled() {
        if ( this._reason ) {
            throw this._reason;
        }
    }

    get_promise() {
        if ( this._reason || this._closed ) {
            return Promise.reject( this._reason );
        }

        return new Promise( ( resolve, reject ) => {
            this.subscribe( reject );
        } );
    }

    subscribe( callback ) {
        if ( this._closed ) {
            return;
        }

        if ( this._reason ) {
            process.nextTick( () => {
                callback( this._reason );
            } );

        } else {
            this._callbacks.push( callback );
        }
    }

    create() {
        const child = new Cancel();

        if ( this._closed ) {
            child.close();

        } else if ( this._reason ) {
            child.cancel( this._reason );

        } else {
            this._callbacks.push( ( reason ) => child.cancel( reason ) );
        }

        return child;
    }
}

module.exports = Cancel;

