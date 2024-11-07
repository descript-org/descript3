/* eslint-disable no-console */
import * as de from '../../lib';

interface ParamsIn1 {
    id: string;
}

const block1 = de.func({
    block: ({ params }) => {
        //  Здесь нужно вернуть тот же тип, что указан в after в качестве входящего результата.
        //  Если after нет, то можно ничего не указывать, все выведется.
        return {
            result: params.p1,
        };
    },
    options: {
        error: () => {
            return {
                e: 1,
            };
        },
        params: ({ params }: { params: ParamsIn1 }) => {
            return {
                p1: params.id,
            };
        },

        after: ({ params, result }) => {
            console.log(params);
            return {
                foo: result.result,
            };
        },
    },
});

de.run(block1, {
    params: {
        id: 'foo',
    },
})
    .then((result) => {
        console.log(result);
    });

const block2 = de.func({
    block: ({ params }: { params: { param: number } }) => {
        const result = { foo: 'bar', param: params.param };
        return Promise.resolve(result);
    },
    options: {
        after: ({ result }) => {
            return result.foo;
        },
    },
});

de.run(block2, {
    params: {
        param: 1,
    },
})
    .then((result) => {
        console.log(result);
    });

const block3 = block2.extend({
    options: {
        params: ({ params }: { params: { param2: number } }) => {
            return {
                param: params.param2,
            };
        },
        after: ({ result, params }) => {
            console.log(result);

            return {
                res: result,
                x: params.param,
            };
        },
    },
});


de.run(block3, {
    params: {
        param2: 2,
    },
})
    .then((result) => {
        console.log(result);
    });


const objBlock = de.object({
    block: {
        foo: block1,
        boo: block2,
    },
});

const block4 = de.func({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    block: ({ params }) => {
        //TODO не выводится params.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //const x = params.id;
        return objBlock;
    },
    options: {
        after: ({ result, params }) => {
            console.log(result);
            console.log(params);

            return {
                res: result,
            };
        },
    },
});

de.run(block4, {
    params: {
        id: '1',
    },
})
    .then((result) => {
        console.log(result);
    });
