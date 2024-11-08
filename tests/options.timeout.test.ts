/* eslint-disable jest/no-conditional-expect */
import * as de from '../lib';

import { getResultBlock } from './helpers';


describe('options.timeout', () => {

    it('fail after timeout', async() => {
        const block = getResultBlock(null, 100).extend({
            options: {
                timeout: 50,
            },
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toBe(de.ERROR_ID.BLOCK_TIMED_OUT);
        }
    });

    it('success before timeout', async() => {
        const data = {
            foo: 42,
        };
        const block = getResultBlock(data, 50).extend({
            options: {
                timeout: 100,
            },
        });

        const result = await de.run(block);

        expect(result).toBe(data);
    });

});
