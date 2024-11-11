import * as de from '../lib';

import { getErrorBlock, getResultBlock, waitForError, waitForValue } from './helpers';


describe('options.after', () => {

    it('after gets { params, context, result }', async() => {
        const spy = jest.fn();
        const blockResult = {
            foo: 42,
        };
        const block = getResultBlock(blockResult).extend({
            options: {
                after: spy,
            },
        });

        const params = {
            bar: 24,
        };
        const context = {
            context: true,
        };
        await de.run(block, { params, context });

        const calls = spy.mock.calls;
        expect(calls[ 0 ][ 0 ].params).toBe(params);
        expect(calls[ 0 ][ 0 ].context).toBe(context);
        expect(calls[ 0 ][ 0 ].result).toBe(blockResult);
    });

    it('after never called if block errors', async() => {
        const blockError = de.error('ERROR');
        const spy = jest.fn();

        const block = getErrorBlock(blockError, 50).extend({
            options: {
                after: spy,
            },
        });

        try {
            await de.run(block);
        } catch (e) {
        }

        expect(spy.mock.calls).toHaveLength(0);
    });

    it.each([ null, false, 0, '', 42, 'foo', {}, undefined ])('after returns %j', async(afterResult) => {
        const blockResult = {
            foo: 42,
        };
        const spy = jest.fn(() => afterResult);
        const block = getResultBlock(blockResult).extend({
            options: {
                after: spy,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(afterResult);
        expect(spy.mock.calls).toHaveLength(1);
    });

    it('after throws', async() => {
        const afterError = de.error('SOME_ERROR');
        const block = getResultBlock(null).extend({
            options: {
                after: () => {
                    throw afterError;
                },
            },
        });

        expect.assertions(1);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }

        expect(e).toBe(afterError);
    });

    it('after throws, error returns value', async() => {
        let errorResult;
        const spyError = jest.fn<any, any>(() => {
            errorResult = {
                bar: 24,
            };
            return errorResult;
        });

        let afterError;
        const block = getResultBlock(null, 50).extend({
            options: {
                after: () => {
                    afterError = de.error('ERROR');
                    throw afterError;
                },
                error: spyError,
            },
        });

        const result = await de.run(block);

        expect(spyError.mock.calls[ 0 ][ 0 ].error).toBe(afterError);
        expect(result).toBe(errorResult);
    });

    it('after returns error', async() => {
        const afterError = de.error('AFTER_ERROR');
        const block = getResultBlock(null).extend({
            options: {
                after: () => afterError,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(afterError);
    });

    it('after returns promise that resolves', async() => {
        const afterResult = {
            foo: 42,
        };
        const block = getResultBlock(null).extend({
            options: {
                after: () => waitForValue(afterResult, 50),
            },
        });

        const result = await de.run(block);

        expect(result).toBe(afterResult);
    });

    it('after returns promise that rejects', async() => {
        const afterError = de.error('SOME_ERROR');
        const block = getResultBlock(null).extend({
            options: {
                after: () => waitForError(afterError, 50),
            },
        });

        expect.assertions(1);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }
        expect(e).toBe(afterError);
    });

    it('after returns promise that rejects, block has deps', async() => {
        let barResult;

        const block = de.func({
            block: ({ generateId }) => {
                const id = generateId();

                return de.object({
                    block: {
                        foo: getResultBlock(null, 50).extend({
                            options: {
                                id: id,
                            },
                        }),

                        bar: getResultBlock(null, 50).extend({
                            options: {
                                deps: id,
                                after: () => {
                                    return new Promise((resolve) => {
                                        setTimeout(() => {
                                            barResult = {
                                                bar: 24,
                                            };
                                            resolve(barResult);
                                        }, 50);
                                    });
                                },
                            },
                        }),
                    },
                });
            },
        });

        //TODO кривые результаты
        const r = await de.run(block);

        expect(r.bar).toBe(barResult);
    });

    it('after returns recursive block', async() => {
        type Params = {
            n: number;
            r: number;
        }
        const factorial: any = de.func({
            block: () => 1,
            options: {
                after: ({ params }: { params: Params }) => {
                    if (params.n === 1) {
                        return {
                            r: params.r,
                        };

                    } else {
                        return factorial.extend({
                            options: {
                                params: ({ params }: { params: Params }) => {
                                    return {
                                        n: params.n - 1,
                                        r: (params.r || 1) * params.n,
                                    };
                                },
                            },
                        });
                    }
                },
            },
        });

        const params = {
            n: 5,
        };

        const result: any = await de.run(factorial, { params });
        expect(result.r).toBe(120);
    });

    it('cancelled during after', async() => {
        const error = de.error('ERROR');
        const spy = jest.fn(() => waitForValue(null, 100));
        const block = getResultBlock(null).extend({
            options: {
                after: spy,
            },
        });
        const cancel = new de.Cancel();
        setTimeout(() => {
            cancel.cancel(error);
        }, 50);

        expect.assertions(2);
        let e;
        try {
            await de.run(block, { cancel });

        } catch (err) {
            e = err;
        }

        expect(e).toBe(error);
        expect(spy.mock.calls).toHaveLength(1);

    });

    describe('inheritance', () => {

        it('parent\'s first, child\'s second', async() => {
            const spy = jest.fn();
            const parent = getResultBlock(null).extend({
                options: {
                    after: () => spy('PARENT'),
                },
            });
            const child = parent.extend({
                options: {
                    after: () => spy('CHILD'),
                },
            });

            await de.run(child);

            const calls = spy.mock.calls;
            expect(calls).toHaveLength(2);
            expect(calls[ 0 ][ 0 ]).toBe('PARENT');
            expect(calls[ 1 ][ 0 ]).toBe('CHILD');
        });

        it('parent throws, child never called', async() => {
            const spy = jest.fn();
            const parentAfterError = de.error('SOME_ERROR');
            const parent = getResultBlock(null).extend({
                options: {
                    after: () => {
                        throw parentAfterError;
                    },
                },
            });
            const child = parent.extend({
                options: {
                    after: spy,
                },
            });

            expect.assertions(2);
            let e;
            try {
                await de.run(child);

            } catch (err) {
                e = err;
            }
            expect(e).toBe(parentAfterError);
            expect(spy.mock.calls).toHaveLength(0);
        });

        it('child throws', async() => {
            const parentAfterResult = {
                foo: 42,
            };
            const childAfterError = de.error('SOME_ERROR');
            const parent = getResultBlock(null).extend({
                options: {
                    after: () => parentAfterResult,
                },
            });
            const child = parent.extend({
                options: {
                    after: () => {
                        throw childAfterError;
                    },
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(child);

            } catch (err) {
                e = err;
            }
            expect(e).toBe(childAfterError);
        });

        it.each([ null, false, 0, '', 42, 'foo', {}, undefined ])('parent returns %j, child gets parent\'s result in { result }', async(value) => {
            const spy = jest.fn<any, any>(() => value);
            const parentAfterResult = {
                foo: 42,
            };
            const parent = getResultBlock(null).extend({
                options: {
                    after: () => parentAfterResult,
                },
            });
            const child = parent.extend({
                options: {
                    after: spy,
                },
            });

            const result = await de.run(child);

            expect(result).toBe(value);
            const calls = spy.mock.calls;
            expect(calls[ 0 ][ 0 ].result).toBe(parentAfterResult);
        });

        it.each([ null, false, 0, '', 42, 'foo', {} ])('child returns %j', async(childAfterResult) => {
            const blockResult = {
                foo: 42,
            };
            const parentAfterResult = {
                bar: 24,
            };
            const parent = getResultBlock(blockResult).extend({
                options: {
                    after: () => parentAfterResult,
                },
            });
            const child = parent.extend({
                options: {
                    after: () => childAfterResult,
                },
            });

            const result = await de.run(child);

            expect(result).toBe(childAfterResult);
        });

    });

    it('after gets beforeResult and block returns afterResult, action never called', async() => {
        const blockResult = {
            blockResult: 1,
        };
        const beforeResult = {
            beforeResult: 1,
        };

        const afterResult = {
            blockResult: 1,
        };

        const blockSpy = jest.fn<any, any>(() => blockResult);
        const afterSpy = jest.fn<any, any>(() => afterResult);

        const block = getResultBlock(blockSpy).extend({
            options: {
                before: () => beforeResult,
                after: afterSpy,
            },
        });

        const params = {
            bar: 24,
        };
        const context = {
            context: true,
        };

        const result = await de.run(block, { params, context });

        const calls = afterSpy.mock.calls;
        expect(blockSpy.mock.calls).toHaveLength(0);
        expect(calls[ 0 ][ 0 ].params).toBe(params);
        expect(calls[ 0 ][ 0 ].context).toBe(context);
        expect(calls[ 0 ][ 0 ].result).toBe(beforeResult);
        expect(result).toBe(afterResult);
    });

});
