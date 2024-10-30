type Results<T> = {
    [K in keyof T]: Exclude<T[K], null | undefined>
}


export default function stripNullAndUndefinedValue<T>(obj: T): Results<T> {
    const r: Partial<Record<keyof T, T[keyof T]>> = {};

    for (const key in obj) {
        const value = obj[ key ];

        if (value != null) {
            r[ key as keyof T] = value;
        }
    }

    return r as Results<T>;
}
