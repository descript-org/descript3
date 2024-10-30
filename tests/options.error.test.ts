/* eslint-disable jest/no-conditional-expect */
import { getErrorBlock, getResultBlock } from './helpers';

import * as de from '../lib';
//  ---------------------------------------------------------------------------------------------------------------  //

describe('options.error', () => {

    it('receives { params, context, error }', async() => {
        const error = de.error('ERROR');
        const spy = jest.fn<any, any>(() => null);
        const block = getErrorBlock(error).extend({
            options: {
                error: spy,
            },
        });

        const params = {
            id: 42,
        };
        const context = {
            context: true,
        };
        await de.run(block, { params, context });

        const arg = spy.mock.calls[ 0 ][ 0 ];
        expect(arg.params).toBe(params);
        expect(arg.context).toBe(context);
        expect(arg.error).toBe(error);
    });

    it('never called if block successful', async() => {
        const blockResult = {
            foo: 42,
        };
        const spy = jest.fn();
        const block = getResultBlock(blockResult).extend({
            options: {
                error: spy,
            },
        });

        await de.run(block);

        expect(spy.mock.calls).toHaveLength(0);
    });

    it('returns another error', async() => {
        //  Нужно делать throw, а не кидать ошибку.
        //  Просто return de.error( ... ) не приводит к ошибке на самом деле.

        const error1 = de.error('ERROR_1');
        const error2 = de.error('ERROR_2');
        const block = getErrorBlock(error1).extend({
            options: {
                error: () => error2,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(error2);
    });

    it('throws ReferenceError', async() => {
        const error1 = de.error('ERROR_1');
        const spy = jest.fn(() => {
            // eslint-disable-next-line no-undef,@typescript-eslint/ban-ts-comment
            // @ts-ignore
            return x;
        });
        const block = getErrorBlock(error1).extend({
            options: {
                error: spy,
            },
        });

        expect.assertions(3);
        try {
            await de.run(block);

        } catch (e) {
            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toBe('ReferenceError');
            expect(spy.mock.calls).toHaveLength(1);
        }
    });

    it('throws de.error', async() => {
        const error1 = de.error('ERROR_1');
        let error2;
        const spy = jest.fn(() => {
            error2 = de.error('ERROR_2');

            throw error2;
        });
        const block = getErrorBlock(error1).extend({
            options: {
                error: spy,
            },
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(e).toBe(error2);
            expect(spy.mock.calls).toHaveLength(1);
        }
    });

    it.each([ { foo: 42 }, 0, '', null, false ])('returns %j', async(value) => {
        const error = de.error('ERROR');
        const block = getErrorBlock(error).extend({
            options: {
                error: () => value,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(value);
    });

    it('returns undefined', async() => {
        const error = de.error('ERROR');
        const spy = jest.fn(() => undefined);
        const block = getErrorBlock(error).extend({
            options: {
                error: spy,
            },
        });

        const result = await de.run(block);
        expect(result).toBeUndefined();
    });

    it.each([ { foo: 42 }, 0, '', null, false, undefined ])('first returns %j, second never called', async(value) => {
        const error = de.error('ERROR');
        const spy = jest.fn();
        const block1 = getErrorBlock(error).extend({
            options: {
                error: () => value,
            },
        });
        const block2 = block1.extend({
            options: {
                error: spy,
            },
        });

        const result = await de.run(block2);

        expect(result).toBe(value);
        expect(spy.mock.calls).toHaveLength(0);
    });

    it('first throws, second gets error from first', async() => {
        const error1 = de.error('ERROR');
        const error2 = de.error('ANOTHER_ERROR');
        const block1 = getErrorBlock(error1, 50).extend({
            options: {
                error: () => {
                    throw error2;
                },
            },
        });
        const spy = jest.fn<any, any>(() => null);
        const block2 = block1.extend({
            options: {
                error: spy,
            },
        });

        await de.run(block2);

        expect(spy.mock.calls[ 0 ][ 0 ].error).toBe(error2);
    });

});
