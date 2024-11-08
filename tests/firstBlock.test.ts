/* eslint-disable jest/no-conditional-expect */

import * as de from '../lib';

describe('de.first', () => {

    it('first block is successful', async() => {
        let result1;
        const spy1 = jest.fn<any, any>(() => {
            result1 = {
                a: 1,
            };
            return result1;
        });
        const block1 = de.func({
            block: spy1,
        });

        const spy2 = jest.fn();
        const block2 = de.func({
            block: spy2,
        });

        const block = de.first({
            block: [ block1, block2 ],
        });

        const result = await de.run(block);

        expect(result).toBe(result1);
        expect(spy1.mock.calls[ 0 ][ 0 ].deps.prev).toEqual([]);
        expect(spy2.mock.calls).toHaveLength(0);
    });

    it('first block throws', async() => {
        let error1;
        const spy1 = jest.fn(() => {
            error1 = de.error({
                id: 'ERROR',
            });
            throw error1;
        });
        const block1 = de.func({
            block: spy1,
        });

        let result2;
        const spy2 = jest.fn<any, any>(() => {
            result2 = {
                a: 1,
            };
            return result2;
        });
        const block2 = de.func({
            block: spy2,
        });

        const block = de.first({
            block: [ block1, block2 ],
        });

        const result = await de.run(block);

        expect(result).toBe(result2);
        expect(spy2.mock.calls[ 0 ][ 0 ].deps.prev).toHaveLength(1);
        expect(spy2.mock.calls[ 0 ][ 0 ].deps.prev[ 0 ]).toBe(error1);
    });

    it('second block throws', async() => {
        let error1;
        const spy1 = jest.fn(() => {
            error1 = de.error({
                id: 'ERROR',
            });
            throw error1;
        });
        const block1 = de.func({
            block: spy1,
        });

        let error2;
        const block2 = de.func({
            block: () => {
                error2 = de.error({
                    id: 'ANOTHER_ERROR',
                });
                throw error2;
            },
        });

        const block = de.first({
            block: [ block1, block2 ],
        });

        expect.assertions(5);
        try {
            await de.run(block);

        } catch (e) {
            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toBe(de.ERROR_ID.ALL_BLOCKS_FAILED);
            expect(e.error.reason).toHaveLength(2);
            expect(e.error.reason[ 0 ]).toBe(error1);
            expect(e.error.reason[ 1 ]).toBe(error2);
        }
    });

});
