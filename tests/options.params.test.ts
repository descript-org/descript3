/* eslint-disable jest/no-conditional-expect */

import * as de from '../lib';

import { getResultBlock } from './helpers';
import type { DescriptBlockId } from '../lib/depsDomain';


describe('options.params', () => {

    it('no params', async() => {
        const spy = jest.fn();
        const block = getResultBlock(spy);

        await de.run(block);

        const calls = spy.mock.calls;
        expect(calls[ 0 ][ 0 ].params).toStrictEqual({});
    });

    describe('params is a function', () => {

        it('params gets { params, context }', async() => {
            const spy = jest.fn<any, any>(() => ({}));
            const block = getResultBlock(null).extend({
                options: {
                    params: spy,
                },
            });

            const params = {
                id: 42,
            };
            const context = {
                context: true,
            };
            await de.run(block, { params, context });

            const calls = spy.mock.calls;
            expect(calls[ 0 ][ 0 ].params).toBe(params);
            expect(calls[ 0 ][ 0 ].context).toBe(context);
        });

        it('params gets { deps }', async() => {
            const spy = jest.fn();

            let dataFoo;
            let idFoo: DescriptBlockId;

            const block = de.func({
                block: ({ generateId }) => {
                    dataFoo = {
                        foo: 42,
                    };
                    idFoo = generateId('foo');

                    return de.object({
                        block: {
                            foo: getResultBlock(dataFoo).extend({
                                options: {
                                    id: idFoo,
                                },
                            }),

                            bar: getResultBlock(null).extend({
                                options: {
                                    deps: idFoo,
                                    params: spy,
                                },
                            }),
                        },
                    });
                },
            });

            await de.run(block);

            const calls = spy.mock.calls;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(calls[ 0 ][ 0 ].deps[ idFoo ]).toBe(dataFoo);
        });

        it.each([ undefined, null, false, '', 0, 42 ])('params returns %j', async(paramsResult) => {
            const spy = jest.fn();
            const block = getResultBlock(spy).extend({
                options: {
                    params: () => paramsResult,
                },
            });

            expect.assertions(3);
            try {
                await de.run(block);

            } catch (e) {
                expect(de.isError(e)).toBe(true);
                expect(e.error.id).toBe(de.ERROR_ID.INVALID_OPTIONS_PARAMS);
                expect(spy.mock.calls).toHaveLength(0);
            }
        });

        it('params returns object, action gets it as { params }', async() => {
            const spy = jest.fn();

            let params;

            const block = getResultBlock(spy).extend({
                options: {
                    params: () => {
                        params = {
                            id: 42,
                        };

                        return params;
                    },
                },
            });

            await de.run(block);

            expect(spy.mock.calls[ 0 ][ 0 ].params).toBe(params);
        });

        it('params throws', async() => {
            const error = de.error('SOME_ERROR');
            const block = getResultBlock(null).extend({
                options: {
                    params: () => {
                        throw error;
                    },
                },
            });

            expect.assertions(1);
            try {
                await de.run(block);

            } catch (e) {
                expect(e).toBe(error);
            }
        });

    });

    describe('inheritance', () => {

        it('child first, then parent', async() => {
            let parentParams;
            const parentSpy = jest.fn<any, any>(() => {
                parentParams = {
                    foo: 42,
                };
                return parentParams;
            });

            let childParams;
            const childSpy = jest.fn<any, any>(() => {
                childParams = {
                    bar: 24,
                };
                return childParams;
            });

            const actionSpy = jest.fn<any, any>();

            const parent = getResultBlock(actionSpy).extend({
                options: {
                    params: parentSpy,
                },
            });
            const child = parent.extend({
                options: {
                    params: childSpy,
                },
            });

            const params = {
                quu: 66,
            };
            await de.run(child, { params });

            expect(childSpy.mock.calls[ 0 ][ 0 ].params).toBe(params);
            expect(parentSpy.mock.calls[ 0 ][ 0 ].params).toBe(childParams);
            expect(actionSpy.mock.calls[ 0 ][ 0 ].params).toBe(parentParams);
        });

    });

});
