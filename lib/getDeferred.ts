type CustomPromise<T, F = any> = {
    catch<TResult = never>(
        onrejected?: ((reason: F) => TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<T | TResult>;
} & Promise<T>;

export type Deffered<R, C> = {
    promise: CustomPromise<R, C>;
    resolve: (value: R | PromiseLike<R>) => void;
    reject: (reason?: C) => void;
}

export default function getDeferred<R, C>(): Deffered<R, C> {
    let resolve: ((value: R | PromiseLike<R>) => void) | null = null;
    let reject: ((reason?: C) => void) | null = null;
    const promise = new Promise<R>(function(_resolve, _reject) {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        promise: promise,
        resolve: resolve as NonNullable<typeof resolve>,
        reject: reject as NonNullable<typeof reject>,
    };
}
