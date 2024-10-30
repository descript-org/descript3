type InferArrayItemOrT<T> = T extends Array<infer I> ? I : T

export default function extendOption<T, P>(what?: T, by?: P): Array<InferArrayItemOrT<T> | InferArrayItemOrT<P>> | null {
    const newArray: Array<any> = [];

    if (what) {
        if (by) {
            return newArray.concat(what, by);
        }

        return newArray.concat(what);
    }

    if (by) {
        return newArray.concat(by);
    }

    return null;
}
