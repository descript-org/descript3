import * as de from '../lib';
import type { SubscribeCallback } from '../lib/cancel';

//  ---------------------------------------------------------------------------------------------------------------  //

let PATH_INDEX = 1;
function getPath() {
    return `/test/${ PATH_INDEX++ }/`;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function waitForValue<V>(value: V, timeout: number) {
    if (timeout > 0) {
        return new Promise<V>((resolve) => {
            global.setTimeout(() => {
                resolve(value);
            }, timeout);
        });
    }

    return Promise.resolve(value);
}

function waitForError<ErrorOrBlock>(error: ErrorOrBlock, timeout: number) {
    if (timeout > 0) {
        return new Promise<ErrorOrBlock>((resolve, reject) => {
            global.setTimeout(() => {
                reject(error);
            }, timeout);
        });
    }

    return Promise.reject<ErrorOrBlock>(error);
}

type Options = {
    onCancel?: SubscribeCallback;
}

function getResultBlock<
    Value extends(unknown | (() => unknown)),
>(value?: Value, timeout = 0, options: Options = {}) {
    return de.func({
        block: async function(args): Promise<Value> {
            const { blockCancel } = args;
            if (options.onCancel) {
                blockCancel.subscribe(options.onCancel);
            }

            await Promise.race([
                waitForValue(null, timeout),
                blockCancel.getPromise(),
            ]);

            if (!de.isBlock(value) && (typeof value === 'function')) {
                return value(args);
            }

            return value as Value;
        },
    });
}

function getErrorBlock<ErrorOrBlock>(error: ErrorOrBlock, timeout = 0) {
    if (!de.isBlock(error) && (typeof error === 'function')) {
        return de.func({
            block: async function(): Promise<ErrorOrBlock> {
                await waitForValue(null, timeout);

                throw error();
            },
        });
    }

    return de.func({
        block: function() {
            return waitForError(error, timeout);
        },
    });
}

function getTimeout(from: number, to: number) {
    return Math.round(from + (Math.random() * (to - from)));
}

function setTimeout(callback: () => unknown, timeout: number) {
    return new Promise((resolve) => {
        global.setTimeout(() => {
            resolve(callback());
        }, timeout);
    });
}

//  ---------------------------------------------------------------------------------------------------------------  //

export {
    getPath,
    getTimeout,
    waitForValue,
    waitForError,
    getResultBlock,
    getErrorBlock,
    setTimeout,
};
