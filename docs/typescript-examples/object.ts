/* eslint-disable no-console */

import * as de from '../../lib';
import type { DescriptHttpBlockResult, InferParamsInFromBlock } from '../../lib/types';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  ---------------------------------------------------------------------------------------------------------------  //
export interface CreateCardRequest {
    addedManually?: boolean;
    addedByIdentifier?: string;
    // card: Card;
    card: Record<string, string>;
}

interface ParamsIn1 {
    id1: string;
    payload: CreateCardRequest;
}
interface ParamsOut1 {
    s1: string;
}
interface Result1 {
    r: number;
}

const block1 = de.http({
    block: {
        body: ({ params }) => params.payload,
    },
    options: {
        params: ({ params }: { params: ParamsIn1; context?: Context }) => {
            return {
                s1: params.id1,
                payload: params.payload,
            };
        },

        after: ({ params, result }: { params: ParamsOut1; result: DescriptHttpBlockResult<Result1> }) => {
            const a = {
                a: result.result.r,
            };
            const b = {
                b: params.s1,
            };

            if (params.s1 === 'lol') {
                return a;
            }

            return b;
        },
    },
});


de.run(block1, {
    params: {
        id1: '67890',
        payload: {
            card: {},
        },
    },
})
    .then((result) => {
        console.log(result);
        return {
            foo: 'a' in result ? result.a : result.b,
            bar: undefined,
        };
    });

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn2 {
    id2: number;
}

const block2 = de.http({
    block: {},
    options: {
        params: ({ params }: {params: ParamsIn2}) => {
            return params;
        },

        after: ({ params }) => {
            return {
                b: String(params.id2),
            };
        },
    },
});

const block2Func = de.func({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    block: ({ params }: { params: InferParamsInFromBlock<typeof block1> & { p1: number } }) => block2,
    //block: () => block2,
    options: {
        after: ({ result }) => {
            console.log(result.b);
            return {
                b: result.b + '2',
                c: 1,
            };
        },
    },
});

de.run(block2Func, {
    params: {
        id1: '67890',
        p1: 1,
        payload: {
            card: {},
        },
    },
})
    .then((result) => {
        console.log(result);
        return {
            foo: result.c,
            bar: result.b,
        };
    });


//  ---------------------------------------------------------------------------------------------------------------  //

const block3 = de.object({
    block: {
        foo: de.http({
            block: {},
            options: {
                params: ({ params }: { params: ParamsIn2; context?: Context }) => {
                    return {
                        s1: params.id2,
                    };
                },

                after: ({ params }) => {
                    return {
                        a: params.s1,
                    };
                },
            },
        }),
        bar: block2Func,
    },
    options: {
        params: ({ params }) => params,
        after: ({ result, params }) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const x = params.id2;
            return {
                foo: {
                    ...result.foo,
                    c: 1,
                },
                bar: result.bar,
            };
        },
    },
});

de.run(block3, {
    params: {
        id1: '12345',
        id2: 67890,
        p1: 1,
        payload: {
            card: {},
        },
    },
})
    .then((result) => {
        return {
            foo: 'a' in result.foo ? result.foo.a : result.foo.error,
            bar: 'b' in result.bar ? result.bar.b : result.bar.error,
        };
    });

const block3Func = de.func({
    block: () => {
        return block3;
    },
    options: {
        after: ({ result }) => {
            return {
                foo: 'a' in result.foo ? result.foo.a + 1 : result.foo.error,
                bar: 'b' in result.bar ? result.bar.b + 1 : result.bar.error,
            };
        },
    },
});

de.run(block3Func, {
    params: {
        id1: '12345',
        id2: 67890,
        payload: {
            card: {},
        },
    },
})
    .then((result) => {
        console.log(result.foo, result.bar);
    });

const block4 = block3.extend({
    options: {
        after: ({ result }) => {
            return (('a' in result.foo ? result.foo.a : result.foo.error.id) || '') +
            (('b' in result.bar ? result.bar.b : result.bar.error.id) || '');
        },
    },
});

const block5 = block3.extend({
    options: {
        error: ({ error }) => {
            if (error.error) {
                throw error;
            }
        },
        after: ({ result }) => result,
    },
});

de.run(block4, {
    params: {
        id1: '12345',
        id2: 67890,
        p1: 1,
        payload: {
            card: {},
        },
    },
})
    .then((result) => {
        console.log(result);
    });


de.run(block5, {
    params: {
        id1: '12345',
        id2: 67890,
        p1: 1,
        payload: {
            card: {},
        },
    },
})
    .then((result) => {
        console.log(result);
    });
