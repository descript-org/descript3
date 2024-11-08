import * as de from '../lib';

import {
    getResultBlock, getErrorBlock, getTimeout,
} from './helpers';

//  ---------------------------------------------------------------------------------------------------------------  //

describe('de.object', () => {

    it('block is undefined #1', () => {
        expect.assertions(2);
        let err;
        try {
            de.object({});

        } catch (e) {
            err = e;
        }

        expect(de.isError(err)).toBe(true);
        expect(err.error.id).toBe(de.ERROR_ID.INVALID_BLOCK);
    });

    it('block is undefined #2', () => {
        expect.assertions(2);
        let err;
        try {
            de.object();

        } catch (e) {
            err = e;

        }

        expect(de.isError(err)).toBe(true);
        expect(err.error.id).toBe(de.ERROR_ID.INVALID_BLOCK);
    });

    it('empty object', async() => {
        const block = de.object({
            block: {},
        });

        const result = await de.run(block);

        expect(result).toEqual({});
    });

    it('two subblocks', async() => {
        const dataFoo = {
            foo: 42,
        };
        const blockFoo = getResultBlock(dataFoo, getTimeout(50, 100));

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, getTimeout(50, 100));

        const block = de.object({
            block: {
                foo: blockFoo,
                bar: blockBar,
            },
        });

        const result = await de.run(block);

        expect(result).toEqual({
            foo: dataFoo,
            bar: dataBar,
        });
        expect(result.foo).toBe(dataFoo);
        expect(result.bar).toBe(dataBar);
    });

    it('two subblocks, one required', async() => {
        const dataFoo = {
            foo: 42,
        };
        const blockFoo = getResultBlock(dataFoo, getTimeout(50, 100));

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, getTimeout(50, 100));

        const block = de.object({
            block: {
                foo: blockFoo.extend({
                    options: {
                        params: ({ params }: { params: { x: number }}) => {
                            return {
                                ...params,
                                x: 1,
                            };
                        },
                        required: true,
                    },
                }),
                bar: blockBar.extend({
                    options: {
                        params: ({ params }: { params: { z: number }}) => {
                            return {
                                ...params,
                                x: 1,
                            };
                        },
                    },
                }),
            },
        });

        const params = {
            x: 1,
            z: 2,
        };

        const result = await de.run(block, { params });

        expect(result).toEqual({
            foo: dataFoo,
            bar: dataBar,
        });
        expect(result.foo).toBe(dataFoo);
        expect(result.bar).toBe(dataBar);
    });

    it('two subblocks, one failed', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, getTimeout(50, 100));

        const block = de.object({
            block: {
                foo: blockFoo,
                bar: blockBar,
            },
        });

        const result = await de.run(block);

        expect(result.foo).toBe(errorFoo);
        expect(result.bar).toBe(dataBar);
    });

    it('two subblocks, both failed', async() => {
        const errorFoo = de.error('SOME_ERROR_1');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));

        const errorBar = de.error('SOME_ERROR_2');
        const blockBar = getErrorBlock(errorBar, getTimeout(50, 100));

        const block = de.object({
            block: {
                foo: blockFoo,
                bar: blockBar,
            },
        });

        const result = await de.run(block);

        expect(result.foo).toBe(errorFoo);
        expect(result.bar).toBe(errorBar);
    });

    it('two subblocks, one required failed #1', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));
        const blockBar = getResultBlock(null, getTimeout(50, 100));

        const block = de.object({
            block: {
                foo: blockFoo.extend({
                    options: {
                        required: true,
                    },
                }),
                bar: blockBar,
            },
        });

        expect.assertions(4);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }
        expect(de.isError(e)).toBe(true);
        expect(e.error.id).toBe(de.ERROR_ID.REQUIRED_BLOCK_FAILED);
        expect(e.error.reason).toBe(errorFoo);
        expect(e.error.path).toBe('.foo');
    });

    it('two subblocks, one required failed #2', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));
        const blockBar = getResultBlock(null, getTimeout(50, 100));
        const blockQuu = getResultBlock(null, getTimeout(50, 100));

        const block = de.object({
            block: {
                foo: de.array({
                    block: [
                        blockFoo.extend({
                            options: {
                                required: true,
                            },
                        }),
                        blockBar,
                    ],
                    options: {
                        required: true,
                    },
                }),
                quu: blockQuu,
            },
        });

        expect.assertions(3);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }

        expect(de.isError(e)).toBe(true);
        expect(e.error.id).toBe(de.ERROR_ID.REQUIRED_BLOCK_FAILED);
        expect(e.error.path).toBe('.foo[ 0 ]');
    });

    it('order of keys', async() => {
        const dataFoo = {
            foo: 42,
        };
        const blockFoo = getResultBlock(dataFoo, 100);

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, 50);

        const block = de.object({
            block: {
                foo: blockFoo,
                bar: blockBar,
            },
        });

        const result = await de.run(block);

        expect(Object.keys(result)).toEqual([ 'foo', 'bar' ]);
    });

    describe('cancel', () => {

        it('cancel object, subblocks cancelled too #1', async() => {
            const actionFooSpy = jest.fn();
            const blockFoo = getResultBlock(null, 150, {
                onCancel: actionFooSpy,
            });

            const actionBarSpy = jest.fn();
            const blockBar = getResultBlock(null, 150, {
                onCancel: actionBarSpy,
            });

            const block = de.object({
                block: {
                    foo: blockFoo,
                    bar: blockBar,
                },
            });

            const abortError = de.error('SOME_ERROR');
            let e;
            try {
                const cancel = new de.Cancel();
                setTimeout(() => {
                    cancel.cancel(abortError);
                }, 100);
                await de.run(block, { cancel });

            } catch (err) {
                e = err;
            }

            expect(e).toBe(abortError);
            expect(actionFooSpy.mock.calls[ 0 ][ 0 ]).toBe(abortError);
            expect(actionBarSpy.mock.calls[ 0 ][ 0 ]).toBe(abortError);
        });

        it('cancel object, subblocks cancelled too #2', async() => {
            const actionFooSpy = jest.fn();
            const blockFoo = getResultBlock(null, 50, {
                onCancel: actionFooSpy,
            });

            const actionBarSpy = jest.fn();
            const blockBar = getResultBlock(null, 150, {
                onCancel: actionBarSpy,
            });

            const block = de.object({
                block: {
                    foo: blockFoo,
                    bar: blockBar,
                },
            });

            const abortError = de.error('SOME_ERROR');
            let e;
            try {
                const cancel = new de.Cancel();
                setTimeout(() => {
                    cancel.cancel(abortError);
                }, 100);
                await de.run(block, { cancel });

            } catch (err) {
                e = err;
            }
            expect(e).toBe(abortError);
            expect(actionFooSpy.mock.calls).toHaveLength(0);
            expect(actionBarSpy.mock.calls[ 0 ][ 0 ]).toBe(abortError);
        });

        it('required block failed, other subblocks cancelled', async() => {
            const errorFoo = de.error('SOME_ERROR');
            const blockFoo = getErrorBlock(errorFoo, 50);

            const actionBarSpy = jest.fn();
            const blockBar = getResultBlock(null, 150, {
                onCancel: actionBarSpy,
            });

            const block = de.object({
                block: {
                    foo: blockFoo.extend({
                        options: {
                            required: true,
                        },
                    }),
                    bar: blockBar,
                },
            });

            try {
                await de.run(block);

            } catch (err) {}

            const call00 = actionBarSpy.mock.calls[ 0 ][ 0 ];
            expect(de.isError(call00)).toBe(true);
            expect(call00.error.id).toBe(de.ERROR_ID.REQUIRED_BLOCK_FAILED);
            expect(call00.error.reason).toBe(errorFoo);
        });

        it('nested subblock cancels all', async() => {

            let cancelReason;

            const block = de.object({
                block: {
                    foo: de.object({
                        block: {
                            bar: getResultBlock().extend({
                                options: {
                                    after: ({ cancel }) => {
                                        cancelReason = de.error('ERROR');
                                        cancel.cancel(cancelReason);
                                    },
                                },
                            }),
                        },
                    }),
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }

            expect(e).toBe(cancelReason);
        });

    });

    describe('inheritance', () => {

        it('two subblocks', async() => {
            const dataFoo = {
                foo: 42,
            };
            const blockFoo = getResultBlock(dataFoo, getTimeout(50, 100));

            const dataBar = {
                bar: 24,
            };
            const blockBar = getResultBlock(dataBar, getTimeout(50, 100));

            const parent = de.object({
                block: {
                    foo: blockFoo,
                    bar: blockBar,
                },
            });
            const child = parent.extend({
                options: {},
            });

            const result = await de.run(child);

            expect(result).toEqual({
                foo: dataFoo,
                bar: dataBar,
            });
            expect(result.foo).toBe(dataFoo);
            expect(result.bar).toBe(dataBar);
        });

    });

});
