import { getErrorBlock, getResultBlock, waitForValue } from './helpers';

import * as de from '../lib';
//  ---------------------------------------------------------------------------------------------------------------  //

describe('de.func', () => {

    it('resolves with value', async() => {
        const data = {
            foo: 42,
        };

        const block = getResultBlock(data, 50);

        const result = await de.run(block);

        expect(result).toBe(data);
    });

    it('resolves with promise', async() => {
        const data = {
            foo: 42,
        };

        const block = de.func({
            block: function() {
                return waitForValue(data, 50);
            },
        });

        const result = await de.run(block);

        expect(result).toBe(data);
    });

    it('resolves with block', async() => {
        const data = {
            foo: 42,
        };

        const block = getResultBlock(data, 50);

        const result = await de.run(block);

        expect(result).toBe(data);
    });

    //  Самый простой способ вычислить факториал!
    it('recursion', async() => {
        type Params = {
            n: number;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const block = de.func({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            block: ({ params }: { params: Params }) => {
                if (params.n === 1) {
                    return 1;

                } else {
                    return block.extend({
                        options: {
                            params: ({ params }: { params: Params }) => {
                                return {
                                    n: params.n - 1,
                                };
                            },
                            after: ({ result, params }: { result: number; params: Params }) => {
                                return (params.n + 1) * result;
                            },
                        },
                    });
                }
            },
        });

        const params = {
            n: 5,
        };

        const result = await de.run(block, { params });
        expect(result).toBe(120);
    });

    it('rejects with de.error', async() => {
        const error = de.error({
            id: 'SOME_ERROR',
        });

        const block = getErrorBlock(error, 50);

        expect.assertions(1);
        let err;
        try {
            await de.run(block);

        } catch (e) {
            err = e;
        }

        expect(err).toBe(error);

    });

    it('cancellable', async() => {
        const block = getResultBlock(null, 100);
        const cancel = new de.Cancel();

        const cancelReason = de.error({
            id: 'SOME_REASON',
        });
        setTimeout(() => {
            cancel.cancel(cancelReason);
        }, 50);

        expect.assertions(1);
        let e;
        try {
            await de.run(block, { cancel });

        } catch (error) {
            e = error;
        }

        expect(e).toBe(cancelReason);
    });

});
