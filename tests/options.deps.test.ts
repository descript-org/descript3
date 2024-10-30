/* eslint-disable jest/no-conditional-expect */
import * as de from '../lib';

import { getErrorBlock, getResultBlock, getTimeout, waitForValue } from './helpers';
import type { DescriptBlockId } from '../lib/depsDomain';


//  ---------------------------------------------------------------------------------------------------------------  //

describe('options.deps', () => {

    it('block with id and without deps', async() => {
        const data = {
            foo: 42,
        };
        const id = Symbol('block');
        const block = getResultBlock(data, 50).extend({
            options: {
                id: id,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(data);
    });

    it('no options.deps, deps is empty object', async() => {
        const spy = jest.fn();
        const block = de.func({
            block: spy,
        });

        await de.run(block);
        expect(spy.mock.calls[ 0 ][ 0 ].deps).toEqual({});
    });

    it('empty deps', async() => {
        const data = {
            foo: 42,
        };
        const block = getResultBlock(data, 50).extend({
            options: {
                deps: [],
            },
        });

        const result = await de.run(block);

        expect(result).toBe(data);
    });

    it('failed block with id and without deps', async() => {
        const error = de.error('ERROR');
        const id = Symbol('block');
        const block = getErrorBlock(error, 50).extend({
            options: {
                id: id,
            },
        });

        expect.assertions(1);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }
        expect(e).toBe(error);
    });

    it('block with invalid deps id #1', async() => {
        const data = {
            foo: 42,
        };
        const id = Symbol('block');
        const block = getResultBlock(data, 50).extend({
            options: {
                deps: id,
            },
        });

        expect.assertions(2);
        let e;
        try {
            await de.run(block);

        } catch (err) {
            e = err;
        }

        expect(de.isError(e)).toBe(true);
        expect(e.error.id).toBe(de.ERROR_ID.INVALID_DEPS_ID);
    });

    it('block with invalid deps id #2', async() => {
        const data = {
            foo: 42,
        };
        const block = de.func({
            block: () => {
                const id = Symbol('block');
                return getResultBlock(data, 50).extend({
                    options: {
                        deps: id,
                    },
                });
            },
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toBe(de.ERROR_ID.INVALID_DEPS_ID);
        }
    });

    it('block depends on block #1 (deps is id)', async() => {
        const spy = jest.fn();

        const blockFoo = getResultBlock(() => spy('FOO'), 50);
        const blockBar = getResultBlock(() => spy('BAR'), 50);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),
                        bar: blockBar.extend({
                            options: {
                                deps: idFoo,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const calls = spy.mock.calls;

        expect(calls).toHaveLength(2);
        expect(calls[ 0 ][ 0 ]).toBe('FOO');
        expect(calls[ 1 ][ 0 ]).toBe('BAR');
    });

    it('block depends on block #2 (deps is array)', async() => {
        const spy = jest.fn();

        const blockFoo = getResultBlock(() => spy('FOO'), 50);
        const blockBar = getResultBlock(() => spy('BAR'), 50);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),
                        bar: blockBar.extend({
                            options: {
                                deps: [ idFoo ],
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const calls = spy.mock.calls;

        expect(calls).toHaveLength(2);
        expect(calls[ 0 ][ 0 ]).toBe('FOO');
        expect(calls[ 1 ][ 0 ]).toBe('BAR');
    });

    it('block depends on block depends on block', async() => {
        const spy = jest.fn();

        const blockFoo = getResultBlock(() => spy('FOO'), 50);
        const blockBar = getResultBlock(() => spy('BAR'), 50);
        const blockQuu = getResultBlock(() => spy('QUU'), 50);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();
                const idBar = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),
                        bar: blockBar.extend({
                            options: {
                                id: idBar,
                                deps: idFoo,
                            },
                        }),
                        quu: blockQuu.extend({
                            options: {
                                deps: idBar,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const calls = spy.mock.calls;

        expect(calls).toHaveLength(3);
        expect(calls[ 0 ][ 0 ]).toBe('FOO');
        expect(calls[ 1 ][ 0 ]).toBe('BAR');
        expect(calls[ 2 ][ 0 ]).toBe('QUU');
    });

    it('block depends on two blocks', async() => {
        const spy = jest.fn();

        const blockFoo = getResultBlock(() => spy('FOO'), getTimeout(50, 100));
        const blockBar = getResultBlock(() => spy('BAR'), getTimeout(50, 100));
        const blockQuu = getResultBlock(() => spy('QUU'), 50);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();
                const idBar = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),
                        bar: blockBar.extend({
                            options: {
                                id: idBar,
                            },
                        }),
                        quu: blockQuu.extend({
                            options: {
                                deps: [ idFoo, idBar ],
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const calls = spy.mock.calls;

        expect(calls).toHaveLength(3);
        expect(calls[ 2 ][ 0 ]).toBe('QUU');
    });

    it('two block depend on block', async() => {
        const spy = jest.fn();

        const blockFoo = getResultBlock(() => spy('FOO'), getTimeout(50, 100));
        const blockBar = getResultBlock(() => spy('BAR'), 50);
        const blockQuu = getResultBlock(() => spy('QUU'), 100);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),
                        bar: blockBar.extend({
                            options: {
                                deps: idFoo,
                            },
                        }),
                        quu: blockQuu.extend({
                            options: {
                                deps: idFoo,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const calls = spy.mock.calls;

        expect(calls).toHaveLength(3);
        expect(calls[ 0 ][ 0 ]).toBe('FOO');
        expect(calls[ 1 ][ 0 ]).toBe('BAR');
        expect(calls[ 2 ][ 0 ]).toBe('QUU');
    });

    it('failed deps #1', async() => {
        const errorFoo = de.error('SOME_ERROR');
        const blockFoo = getErrorBlock(errorFoo, 50);

        const bodyBar = jest.fn<any, any>(() => undefined);
        const blockBar = getResultBlock(bodyBar, 50);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: blockBar.extend({
                            options: {
                                deps: idFoo,
                            },
                        }),
                    },
                });
            },
        });

        const result = await de.run(block);

        expect.assertions(4);
        expect(de.isError(result.bar)).toBe(true);

        if ('error' in result.bar) {
            expect(result.bar.error.id).toBe(de.ERROR_ID.DEPS_ERROR);
            expect(result.bar.error.reason).toBe(errorFoo);
        }
        expect(bodyBar).toHaveBeenCalledTimes(0);
    });

    it('failed deps #2', async() => {
        const errorFoo = de.error('SOME_ERROR_1');
        const blockFoo = getErrorBlock(errorFoo, 100);

        const errorBar = de.error('SOME_ERROR_2');
        const blockBar = getErrorBlock(errorBar, 50);

        const bodyQuu = jest.fn();
        const blockQuu = getResultBlock(bodyQuu, 50);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();
                const idBar = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: blockBar.extend({
                            options: {
                                id: idBar,
                            },
                        }),

                        quu: blockQuu.extend({
                            options: {
                                deps: [ idFoo, idBar ],
                            },
                        }),
                    },
                });
            },
        });

        const result = await de.run(block);

        expect.assertions(4);

        expect(de.isError(result.quu)).toBe(true);
        if ('error' in result.quu) {
            expect(result.quu.error.id).toBe(de.ERROR_ID.DEPS_ERROR);
            //  blockBar падает за 50 мс, а blockFoo за 100 мс.
            //  Поэтому в reason будет errorBar.
            expect(result.quu.error.reason).toBe(errorBar);
        }
        expect(bodyQuu).toHaveBeenCalledTimes(0);
    });

    it('deps not resolved #1', async() => {
        const blockFoo = getResultBlock(null, 50);
        const blockBar = getResultBlock(null, 100);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo,

                        bar: blockBar.extend({
                            options: {
                                deps: idFoo,
                            },
                        }),
                    },
                });
            },
        });

        const result = await de.run(block);

        expect.assertions(2);
        expect(de.isError(result.bar)).toBe(true);

        if (result.bar && 'error' in result.bar) {
            expect(result.bar.error.id).toBe(de.ERROR_ID.DEPS_NOT_RESOLVED);
        }
    });

    it('deps not resolved #2', async() => {
        const blockFoo = getResultBlock(null, 50);
        const blockBar = getResultBlock(null, 100);

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo,

                        bar: blockBar.extend({
                            options: {
                                deps: idFoo,
                            },
                        }),
                    },
                });
            },
        });

        const result = await de.run(block);

        expect.assertions(2);

        expect(de.isError(result.bar)).toBe(true);

        if (result.bar && 'error' in result.bar) {
            expect(result.bar.error.id).toBe(de.ERROR_ID.DEPS_NOT_RESOLVED);
        }
    });

    it('one block with deps', async() => {
        const block = de.func({
            block: ({ generateId }) => {
                const id = generateId();

                return getResultBlock(null, 50).extend({
                    options: {
                        deps: id,
                    },
                });
            },
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toBe(de.ERROR_ID.DEPS_NOT_RESOLVED);
        }
    });

    it('block returns another block that depends on parent block', async() => {
        const block = de.func({
            block: ({ generateId }) => {
                const id = generateId();

                const child = getResultBlock(null, 50).extend({
                    options: {
                        deps: id,
                    },
                });

                return getResultBlock(child, 50).extend({
                    options: {
                        id: id,
                    },
                });
            },
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toBe(de.ERROR_ID.DEPS_NOT_RESOLVED);
        }


    });

    it('before( { deps } ) has deps results #1', async() => {
        const dataFoo = {
            foo: 42,
        };
        const blockFoo = getResultBlock(dataFoo, 50);
        const blockBar = getResultBlock(null, 50);

        const beforeBar = jest.fn();

        let idFoo: DescriptBlockId;
        const block = de.func({
            block: ({ generateId }) => {
                idFoo = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: blockBar.extend({
                            options: {
                                deps: idFoo,

                                before: beforeBar,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const deps = beforeBar.mock.calls[ 0 ][ 0 ].deps;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(deps[ idFoo ]).toBe(dataFoo);
    });

    it('before( { deps } ) has deps results #2', async() => {
        const dataFoo = {
            foo: 42,
        };
        const blockFoo = getResultBlock(dataFoo, 300);

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, 200);

        const blockQuu = getResultBlock(null, 100);

        const beforeQuu = jest.fn();

        let idFoo: DescriptBlockId;
        let idBar: DescriptBlockId;
        const block = de.func({
            block: ({ generateId }) => {
                idFoo = generateId();
                idBar = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: blockBar.extend({
                            options: {
                                id: idBar,
                            },
                        }),

                        quu: blockQuu.extend({
                            options: {
                                deps: [ idFoo, idBar ],

                                before: beforeQuu,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const deps = beforeQuu.mock.calls[ 0 ][ 0 ].deps;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(deps[ idFoo ]).toBe(dataFoo);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(deps[ idBar ]).toBe(dataBar);
    });

    it('before( { deps } ) has not results from other blocks', async() => {
        const dataFoo = {
            foo: 42,
        };
        const blockFoo = getResultBlock(dataFoo, 50);

        const dataBar = {
            bar: 24,
        };
        const blockBar = getResultBlock(dataBar, 100);

        const blockQuu = getResultBlock(null, 50);

        const beforeQuu = jest.fn();

        let idFoo: DescriptBlockId;
        let idBar: DescriptBlockId;
        const block = de.func({
            block: ({ generateId }) => {
                idFoo = generateId();
                idBar = generateId();

                return de.object({
                    block: {
                        foo: blockFoo.extend({
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: blockBar.extend({
                            options: {
                                id: idBar,
                            },
                        }),

                        quu: blockQuu.extend({
                            options: {
                                deps: idBar,

                                before: beforeQuu,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const deps = beforeQuu.mock.calls[ 0 ][ 0 ].deps;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(deps[ idFoo ]).toBeUndefined();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(deps[ idBar ]).toBe(dataBar);
    });

    it('wait for result of de.func', async() => {
        const beforeQuu = jest.fn();

        const dataFoo = {
            foo: 42,
        };
        let idFoo: DescriptBlockId;

        const block = de.func({
            block: ({ generateId }) => {
                idFoo = generateId();

                return de.object({
                    block: {
                        bar: getResultBlock(() => {
                            return getResultBlock(dataFoo, 50).extend({
                                options: {
                                    id: idFoo,
                                },
                            });
                        }, 50),

                        quu: getResultBlock(null, 50).extend({
                            options: {
                                deps: idFoo,

                                before: beforeQuu,
                            },
                        }),
                    },
                });
            },
        });

        await de.run(block);

        const deps = beforeQuu.mock.calls[ 0 ][ 0 ].deps;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(deps[ idFoo ]).toBe(dataFoo);
    });

    it('result of de.func has deps #1', async() => {
        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: getResultBlock(null, 50).extend({
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: de.func({
                            block: () => {
                                return new Promise((resolve) => {
                                    setTimeout(() => {
                                        resolve(getResultBlock(null, 50).extend({
                                            options: {
                                                deps: idFoo,
                                            },
                                        }));
                                    }, 100);
                                });
                            },
                        }),
                    },
                });
            },
        });

        const result = await de.run(block);

        expect(result).toEqual({ foo: null, bar: null });

    });

    it('result of de.func has deps #2', async() => {
        let errorFoo;

        const block = de.func({
            block: ({ generateId }) => {
                const idFoo = generateId();

                return de.object({
                    block: {
                        foo: de.func({
                            block: async() => {
                                await waitForValue(null, 50);

                                errorFoo = de.error('ERROR');
                                throw errorFoo;
                            },
                            options: {
                                id: idFoo,
                            },
                        }),

                        bar: de.func({
                            block: async() => {
                                await waitForValue(null, 50);

                                return getResultBlock(null, 50).extend({
                                    options: {
                                        deps: idFoo,
                                    },
                                });
                            },
                        }),
                    },
                });
            },
        });

        const result = await de.run(block);

        expect.assertions(4);
        expect(result.foo).toBe(errorFoo);
        expect(de.isError(result.bar)).toBe(true);

        if (result.bar && 'error' in result.bar) {
            expect(result.bar.error.id).toBe(de.ERROR_ID.DEPS_ERROR);
            expect(result.bar.error.reason).toBe(errorFoo);
        }
    });

    it.each([ Symbol('foo') ])('unresolved deps #1, id is %p', async(id) => {
        const block = getResultBlock(null, 50).extend({
            options: {
                deps: id,
            },
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (error) {
            expect(de.isError(error)).toBe(true);
            expect(error.error.id).toBe(de.ERROR_ID.INVALID_DEPS_ID);
        }
    });

    it.each([ Symbol('foo') ])('unresolved deps #2, id is %p', async(id) => {
        const blockFoo = getResultBlock(null, 50);
        const blockBar = getResultBlock(null, 50);

        const block = de.object({
            block: {
                foo: blockFoo,

                bar: blockBar.extend({
                    options: {
                        deps: id,
                    },
                }),
            },
        });

        const result = await de.run(block);
        expect.assertions(2);
        expect(de.isError(result.bar)).toBe(true);
        if (result.bar && 'error' in result.bar) {
            expect(result.bar.error.id).toBe(de.ERROR_ID.INVALID_DEPS_ID);
        }
    });

    it('fix 3.0.19', async() => {
        const block = de.func({
            block: ({ generateId }) => {
                const idA = generateId();
                const idC = generateId();

                return de.object({
                    block: {
                        A: getErrorBlock(() => de.error('ERROR_A'), 50).extend({
                            options: {
                                id: idA,
                            },
                        }),

                        //  Вот этот блок падает из-за A, n_active_blocks при этом не инкрементился,
                        //  но в конце декрементился. В итоге n_active_blocks разъезжался и уходил в минус.
                        //
                        B: getResultBlock(null, 50).extend({
                            options: {
                                deps: idA,
                            },
                        }),

                        C: getResultBlock(null, 200).extend({
                            options: {
                                id: idC,
                            },
                        }),

                        //  Этот блок зависит от C, но когда B падает из-за блока A,
                        //  неправильно декрементился счетчик n_active_blocks и D решал, что
                        //  зависимости не сходятся. Короче, какая-то Санта Барбара.
                        //
                        D: getResultBlock(null, 50).extend({
                            options: {
                                deps: idC,
                                required: true,
                            },
                        }),
                    },
                });
            },
        });

        const r = await de.run(block);

        expect(r.D).toBeNull();
    });


    describe('de.pipe', () => {

        it('second block in pipe depends of the first one', async() => {
            let resultBar;
            const block = de.func({
                block: ({ generateId }) => {
                    const idFoo = generateId();
                    const blockFoo = getResultBlock(null, 50).extend({
                        options: {
                            id: idFoo,
                        },
                    });

                    resultBar = {
                        bar: 24,
                    };
                    const blockBar = getResultBlock(resultBar, 50).extend({
                        options: {
                            deps: idFoo,
                        },
                    });

                    return de.pipe({
                        block: [ blockFoo, blockBar ],
                    });
                },
            });

            const result = await de.run(block);

            expect(result).toBe(resultBar);
        });

        it('first block in pipe depends of the second one', async() => {
            const block = de.func({
                block: ({ generateId }) => {
                    const idBar = generateId();

                    const blockFoo = getResultBlock(null, 50).extend({
                        options: {
                            deps: idBar,
                        },
                    });
                    const blockBar = getResultBlock(null, 50).extend({
                        options: {
                            deps: idBar,
                        },
                    });

                    return de.pipe({
                        block: [ blockFoo, blockBar ],
                    });
                },
            });

            expect.assertions(2);
            try {
                await de.run(block);

            } catch (e) {
                expect(de.isError(e)).toBe(true);
                expect(e.error.id).toBe(de.ERROR_ID.DEPS_NOT_RESOLVED);
            }
        });

    });

});
