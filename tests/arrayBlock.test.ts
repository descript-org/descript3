import * as de from '../lib' ;

import {
    //  wait_for_value,
    //  wait_for_error,
    getResultBlock,
    getErrorBlock,
    getTimeout,
} from './helpers' ;

import { describe, it, expect, jest } from '@jest/globals';

//  ---------------------------------------------------------------------------------------------------------------  //

describe('de.array', () => {

    it('block is undefined #1', () => {
        expect.assertions(2);

        let error;

        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            de.array({
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                block: undefined,
            });

        } catch (e) {
            error = e;
        }

        expect(de.isError(error)).toBe(true);
        expect(error.error.id).toBe(de.ERROR_ID.INVALID_BLOCK);
    });

    it('block is undefined #2', () => {
        expect.assertions(2);
        let error;

        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            de.array({});

        } catch (e) {
            error = e;
        }

        expect(de.isError(error)).toBe(true);
        expect(error.error.id).toBe(de.ERROR_ID.INVALID_BLOCK);
    });

    it('empty array', async() => {
        const block = de.array({
            block: [],
        });

        const result = await de.run(block);

        expect(result).toEqual([]);
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

        const block = de.array({
            block: [
                blockFoo,
                blockBar,
            ],
        });

        const result = await de.run(block);

        expect(result).toEqual([
            dataFoo,
            dataBar,
        ]);
        const r1 = result[ 0 ];
        expect(r1).toBe(dataFoo);
        expect(result[ 1 ]).toBe(dataBar);
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

        const block = de.array({
            block: [
                blockFoo.extend({
                    options: {
                        required: true,
                    },
                }),
                blockBar,
            ],
        });

        const result = await de.run(block);
        //const result2 = block.run({});

        expect(result).toEqual([
            dataFoo,
            dataBar,
        ]);
        expect(result[ 0 ]).toBe(dataFoo);
        expect(result[ 1 ]).toBe(dataBar);
    });

    it('two subblocks, one failed', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, getTimeout(50, 100));

        const block = de.array({
            block: [
                blockFoo,
                blockBar,
            ],
        });

        const result = await de.run(block);

        expect(result[ 0 ]).toBe(errorFoo);
        expect(result[ 1 ]).toBe(dataBar);
    });

    it('two subblocks, both failed', async() => {
        const errorFoo = de.error('SOME_ERROR_1');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));

        const errorBar = de.error('SOME_ERROR_2');
        const blockBar = getErrorBlock(errorBar, getTimeout(50, 100));

        const block = de.array({
            block: [
                blockFoo,
                blockBar,
            ],
        });

        const result = await de.run(block);

        expect(result[ 0 ]).toBe(errorFoo);
        expect(result[ 1 ]).toBe(errorBar);
    });

    it('two subblocks, one required failed #1', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, getTimeout(50, 100));

        const block = de.array({
            block: [
                blockFoo.extend({
                    options: {
                        required: true,
                    },
                }),
                blockBar,
            ],
        });

        expect.assertions(4);

        let error;

        try {
            await de.run(block);

        } catch (e) {
            error = e;
        }

        expect(de.isError(error)).toBe(true);
        expect(error.error.id).toBe(de.ERROR_ID.REQUIRED_BLOCK_FAILED);
        expect(error.error.reason).toBe(errorFoo);
        expect(error.error.path).toBe('[ 0 ]');
    });

    it('two subblocks, one required failed #2', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, getTimeout(50, 100));
        const blockBar = getResultBlock(null, getTimeout(50, 100));
        const blockQuu = getResultBlock(null, getTimeout(50, 100));

        const blockComplex = de.object({
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

            options: {
                required: true,
            },
        });

        const block = de.array({
            block: [
                blockComplex,
                blockQuu,
            ],
        });

        expect.assertions(3);
        let error;

        try {
            const params = {
                z: 1,
                x: 1,
            };

            await de.run(block, {
                params,
            });

        } catch (e) {
            error = e;
        }

        expect(de.isError(error)).toBe(true);
        expect(error.error.id).toBe(de.ERROR_ID.REQUIRED_BLOCK_FAILED);
        expect(error.error.path).toBe('[ 0 ].foo');
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

            const block = de.array({
                block: [
                    blockFoo,
                    blockBar,
                ],
            });

            const abortError = de.error('SOME_ERROR');
            let error;

            try {
                const cancel = new de.Cancel();
                setTimeout(() => {
                    cancel.cancel(abortError);
                }, 100);
                await de.run(block, { cancel });

            } catch (e) {
                error = e;
            }

            expect(error).toBe(abortError);
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

            const block = de.array({
                block: [
                    blockFoo,
                    blockBar,
                ],
            });

            const abortError = de.error('SOME_ERROR');

            let error;

            try {
                const cancel = new de.Cancel();
                setTimeout(() => {
                    cancel.cancel(abortError);
                }, 100);
                await de.run(block, { cancel });

            } catch (e) {
                error = e;
            }

            expect(error).toBe(abortError);
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

            const block = de.array({
                block: [
                    blockFoo.extend({
                        options: {
                            required: true,
                        },
                    }),
                    blockBar,
                ],
            });

            try {
                await de.run(block);

            } catch (e) {}

            const call00 = actionBarSpy.mock.calls[ 0 ][ 0 ];
            expect(de.isError(call00)).toBe(true);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(call00.error.id).toBe(de.ERROR_ID.REQUIRED_BLOCK_FAILED);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(call00.error.reason).toBe(errorFoo);
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

            const parent = de.array({
                block: [
                    blockFoo,
                    blockBar,
                ],
            });
            const child = parent.extend({ options: {} });

            const result = await de.run(child);

            expect(result).toEqual([
                dataFoo,
                dataBar,
            ]);
            expect(result[ 0 ]).toBe(dataFoo);
            expect(result[ 1 ]).toBe(dataBar);
        });

    });

});
