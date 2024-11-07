/* eslint-disable no-console */

import * as de from '../../lib';
import type { DescriptHttpBlockResult } from '../../lib/types';
import { DEFAULT_OPTIONS } from '../../lib/request';

//  ---------------------------------------------------------------------------------------------------------------  //


interface ParamsIn1 {
    id1: string;
}

interface ResultIn1 {
    foo: string;
}

const block1 = de.http({
    block: {
        parseBody({ body, headers }) {
            if (!body) {
                return null;
            }

            if (headers['content-type']?.startsWith('application/json')) {
                return JSON.parse(body.toString('utf-8'));
            } else {
                return body;
            }
        },
        isError: (error) => {
            const statusCode = error.error.statusCode;
            if (statusCode && statusCode >= 400 && statusCode <= 499) {
                return false;
            }

            return DEFAULT_OPTIONS.isError?.(error);
        },
        isRetryAllowed: (error, requestOptions) => {
            const method = requestOptions.httpOptions.method;
            if (method === 'POST') {
                const id = error.error.id;
                const statusCode = error.error.statusCode;
                if (
                    id === de.ERROR_ID.TCP_CONNECTION_TIMEOUT ||
                    id === de.ERROR_ID.REQUEST_TIMEOUT ||
                    (statusCode && statusCode >= 500)
                ) {
                    return true;
                }
                return true;
            }

            return DEFAULT_OPTIONS.isRetryAllowed?.(error, requestOptions);
        },
    },

    options: ({
        before: () => {
            //TODO возврат результата и типизация в after
            // return {
            //     d: 1,
            // };
        },
        error: () => {
            return {
                x: 's',
            };
        },
        params: ({ params }: { params: ParamsIn1 }) => {
            return {
                s1: params.id1,
            };
        },

        //TODO автовыведение ResultIn1
        after: ({ params, result }: { params: { s1: ParamsIn1['id1']}; result: DescriptHttpBlockResult<ResultIn1> }) => {
            return {
                a: params.s1,
                b: result.result.foo,
            };
        },
    }),
});

de.run(block1, {
    params: {
        id1: '12345',
    },
})
    .then((result) => {
        console.log(result);
    });

interface ParamsIn2 {
    id2: string;
}

const block2 = block1.extend({
    options: ({
        params: ({ params }: { params: ParamsIn2 & ParamsIn1}) => {
            return {
                id1: params.id1,
                s2: params.id2,
            };
        },


        after: ({ params, result }) => {
            return {
                ...result,
                a: params.s2,
                c: 'b' in result ? result.b : result.x,
            };
        },
    }),
});

de.run(block2, {
    //TODO что за undefined?
    params: {
        id1: '12345',
        id2: '12345',

    },
})
    .then((result) => {
        console.log(result.c);
    });

const block3 = de.http({
    block: {},
    options: {},
});

const block4 = block3.extend({
    block: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        headers: ({ params }) => {
            return {
                'x-header': String(params.param2),
            };
        },
    },
    options: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        params: ({ params }: { params: { param: number } }) => {
            return {
                param2: params.param,
            };
        },
    },
});

de.run(block4, {
    params: {
        param: 1,
    },
});
