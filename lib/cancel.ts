//  https://github.com/tc39/proposal-cancellation

import type { DescriptError, Reason, ERROR_ID } from './error';
import { createError } from './error' ;

export type SubscribeCallback = (reason: DescriptError) => unknown;

class Cancel {

    private _reason: DescriptError | null = null;
    private _closed = false;
    private _callbacks: Array<SubscribeCallback> = [];

    cancel(reason: Reason | ERROR_ID) {
        if (this._reason || this._closed) {
            return;
        }

        this._reason = createError(reason);

        this._callbacks.forEach((callback) => callback(this._reason!));
        this._callbacks = [];
    }

    close() {
        this._closed = true;
        this._callbacks = [];
    }

    throwIfCancelled() {
        if (this._reason) {
            throw this._reason;
        }
    }

    getPromise() {
        if (this._reason) {
            return Promise.reject<DescriptError>(this._reason);
        }

        //  Если this._closed, возвращаем промис, который никогда не зарезолвится/реджектится.
        //
        return new Promise<DescriptError>((resolve, reject) => {
            this.subscribe(reject);
        });
    }

    subscribe(callback: SubscribeCallback) {
        if (this._closed) {
            return;
        }

        if (this._reason) {
            callback(this._reason);

        } else {
            this._callbacks.push(callback);
        }
    }

    create() {
        const child = new Cancel();

        if (this._closed) {
            child.close();

        } else if (this._reason) {
            child.cancel(this._reason);

        } else {
            this._callbacks.push((reason) => child.cancel(reason));
        }

        return child;
    }
}

export default Cancel;
