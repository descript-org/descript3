import { getResultBlock, waitForError, waitForValue } from './helpers';

import * as de from '../lib';

describe('options.before', () => {

    it('before gets { params, context }', async() => {
        const spy = jest.fn();
        const block = getResultBlock(null).extend({
            options: {
                before: spy,
            },
        });

        const params = {
            foo: 42,
        };
        const context = {
            context: true,
        };
        await de.run(block, { params, context });

        const calls = spy.mock.calls;
        expect(calls[ 0 ][ 0 ].params).toBe(params);
        expect(calls[ 0 ][ 0 ].context).toBe(context);
    });

    [ null, false, 0, '', 42, 'foo', {} ].forEach((beforeResult) => {
        it(`before returns ${ beforeResult }, action never called`, async() => {
            const spy = jest.fn();
            const block = getResultBlock(spy).extend({
                options: {
                    before: () => beforeResult,
                },
            });

            const result = await de.run(block);

            expect(result).toBe(beforeResult);
            expect(spy.mock.calls).toHaveLength(0);
        });
    });

    it('before throws, action never called', async() => {
        const spy = jest.fn();
        const beforeError = de.error('SOME_ERROR');
        const block = getResultBlock(spy).extend({
            options: {
                before: () => {
                    throw beforeError;
                },
            },
        });

        expect.assertions(2);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }

        expect(e).toBe(beforeError);
        expect(spy.mock.calls).toHaveLength(0);
    });

    it('before returns promise that rejects, action never called', async() => {
        const spy = jest.fn();
        const beforeError = de.error('SOME_ERROR');
        const block = getResultBlock(spy).extend({
            options: {
                before: () => waitForError(beforeError, 50),
            },
        });

        expect.assertions(2);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }
        expect(e).toBe(beforeError);
        expect(spy.mock.calls).toHaveLength(0);
    });

    it('before returns promise that resolves, block has deps', async() => {
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
                                before: () => {
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

        const r = await de.run(block);

        expect(r.bar).toBe(barResult);
    });

    it('before returns promise that resolves, action never called', async() => {
        const spy = jest.fn();
        const beforeResult = {
            foo: 42,
        };
        const block = getResultBlock(spy).extend({
            options: {
                before: () => waitForValue(beforeResult, 50),
            },
        });

        const result = await de.run(block);

        expect(result).toBe(beforeResult);
        expect(spy.mock.calls).toHaveLength(0);
    });

    it('before returns undefined', async() => {
        const blockResult = {
            foo: 42,
        };
        const block = getResultBlock(blockResult).extend({
            options: {
                before: () => undefined,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(blockResult);
    });

    it('before returns recursive block', async() => {
        type Params = {
            n: number;
            r: number;
        }
        const factorial: any = de.func({
            block: () => 1,
            options: {
                before: ({ params }: { params: Params}) => {
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

    describe('inheritance', () => {

        it('child\'s first, parent\'s second', async() => {
            const spy = jest.fn();
            const parent = getResultBlock(null).extend({
                options: {
                    before: () => spy('PARENT'),
                },
            });
            const child = parent.extend({
                options: {
                    before: () => spy('CHILD'),
                },
            });

            await de.run(child);

            const calls = spy.mock.calls;
            expect(calls).toHaveLength(2);
            expect(calls[ 0 ][ 0 ]).toBe('CHILD');
            expect(calls[ 1 ][ 0 ]).toBe('PARENT');
        });

        it.each([ null, false, 0, '', 42, 'foo', {} ])('child returns %j, parent never called', async(childBeforeResult) => {
            const spy = jest.fn();
            const parent = getResultBlock(null).extend({
                options: {
                    before: spy,
                },
            });
            const child = parent.extend({
                options: {
                    before: () => childBeforeResult,
                },
            });

            const result = await de.run(child);

            expect(result).toBe(childBeforeResult);
            expect(spy.mock.calls).toHaveLength(0);
        });

        it.each([ null, false, 0, '', 42, 'foo', {} ])('child returns undefined, parent returns %j', async(parentBeforeResult) => {
            const parent = getResultBlock(null).extend({
                options: {
                    before: () => parentBeforeResult,
                },
            });
            const child = parent.extend({
                options: {
                    before: () => undefined,
                },
            });

            const result = await de.run(child);

            expect(result).toBe(parentBeforeResult);
        });

        it('child returns undefined, parent returns undefined', async() => {
            const blockResult = {
                foo: 42,
            };
            const parent = getResultBlock(blockResult).extend({
                options: {
                    before: () => undefined,
                },
            });
            const child = parent.extend({
                options: {
                    before: () => undefined,
                },
            });

            const result = await de.run(child);

            expect(result).toBe(blockResult);
        });

        it('child returns undefined, parent throws', async() => {
            const parentBeforeError = de.error('SOME_ERROR');
            const parent = getResultBlock(null).extend({
                options: {
                    before: () => {
                        throw parentBeforeError;
                    },
                },
            });
            const child = parent.extend({
                options: {
                    before: () => undefined,
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(child);

            } catch (err) {
                e = err;
            }
            expect(e).toBe(parentBeforeError);
        });

        it('child throws, parent never called', async() => {
            const spy = jest.fn();
            const childBeforeError = de.error('SOME_ERROR');
            const parent = getResultBlock(null).extend({
                options: {
                    before: spy,
                },
            });
            const child = parent.extend({
                options: {
                    before: () => {
                        throw childBeforeError;
                    },
                },
            });

            expect.assertions(2);
            let e;
            try {
                await de.run(child);

            } catch (err) {
                e = err;
            }
            expect(e).toBe(childBeforeError);
            expect(spy.mock.calls).toHaveLength(0);
        });

    });

});
