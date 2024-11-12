/* eslint-disable no-console */
import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn1 {
    id1: string;
}

const block1 = de.http({
    block: {},
    options: {
        params: ({ params }: { params: ParamsIn1 }) => {
            return {
                s1: params.id1,
            };
        },

        after: ({ params }) => {
            return {
                b1: 1,
                a: params.s1,
            };
        },
    },
});

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn2 {
    id2: number;
}

const block2 = de.http({
    block: {},
    options: {

        params: ({ params }: { params: ParamsIn2 }) => {
            return params;
        },

        after: ({ params }) => {
            return {
                p: params.id2,
                b2: '2',
            };
        },
    },
});

//  ---------------------------------------------------------------------------------------------------------------  //

const block3 = de.pipe({
    block: [
        block1,
        block2,
        de.func({
            block: () => 1,
            options: {},
        }),
    ] as const,
    options: {
        params: ({ params }) => {
            return params;
        },
        after: ({ result }) => {
            if (typeof result === 'number') {
                return result;
            } else if ('b1' in result) {
                return result.b1;
            } else if ('b2' in result) {
                return result.b2;
            }
        },
    },
});

de.run(block3, {
    params: {
        id1: '12345',
        id2: 67890,
    },
})
    .then((result) => {
        console.log(result);
    });

const block4 = block3.extend({
    options: {
        after: ({ result }) => {
            return result;
        },
    },
});

de.run(block4, {
    params: {
        id1: '12345',
        id2: 67890,
    },
})
    .then((result) => {
        console.log(result);
    });


const bfn1 = de.func({
    block: ({ params }: { params: { p1: number } }) => {
        return {
            b1: params.p1,
        };
    },
    options: {
        after: ({ result }) => {
            return {
                r: 1,
                b1: result.b1,
            };
        },
    },
});


const bfn2 = de.func({
    block: ({ params }: { params: { p2: string } }) => {
        return {
            b2: params.p2,
        };
    },
    options: {
        after: ({ result }) => {
            return {
                r2: 1,
                b2: result.b2,
            };
        },
    },
});

const bfn3 = de.pipe({
    block: [
        bfn1,
        bfn2,
    ],
    options: {
        params: ({ params }) => {
            return params;
        },
        after: ({ result }) => {
            if (!de.isError(result)) {
                return ('b1' in result ? result.b1 : result.b2);
            }
            return result;
        },
    },
});

de.run(bfn3, {
    params: {
        p2: '12345',
        p1: 67890,
    },
})
    .then((result) => {
        console.log(result);
    });