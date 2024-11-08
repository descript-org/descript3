import type { UnionToIntersection } from './types';

export default function extend(dest: Record<string, any>, ...srcObjects: Array<Record<string, any>>) {
    for (const src of srcObjects) {
        if (src) {
            for (const key in src) {
                const value = src[ key ];
                if (value !== undefined) {
                    dest[ key ] = value;
                }
            }
        }
    }

    return dest as UnionToIntersection<typeof dest & (typeof srcObjects extends Array<infer O> ? O : never)>;
}
