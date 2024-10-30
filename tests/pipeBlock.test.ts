/* eslint-disable jest/no-conditional-expect */
import * as de from '../lib';

describe('de.pipe', () => {

    it('all blocks are successful', async() => {
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

        let result2;
        const spy2 = jest.fn<any, any>(() => {
            result2 = {
                b: 2,
            };
            return result2;
        });
        const block2 = de.func({
            block: spy2,
        });

        let result3;
        const spy3 = jest.fn<any, any>(() => {
            result3 = {
                c: 3,
            };
            return result3;
        });
        const block3 = de.func({
            block: spy3,
        });

        const block = de.pipe({
            block: [ block1, block2, block3 ],
        });

        const result = await de.run(block);

        expect(spy1.mock.calls[ 0 ][ 0 ].deps.prev).toEqual([]);
        expect(spy2.mock.calls[ 0 ][ 0 ].deps.prev).toHaveLength(1);
        expect(spy2.mock.calls[ 0 ][ 0 ].deps.prev[ 0 ]).toBe(result1);
        expect(spy3.mock.calls[ 0 ][ 0 ].deps.prev).toHaveLength(2);
        expect(spy3.mock.calls[ 0 ][ 0 ].deps.prev[ 0 ]).toBe(result1);
        expect(spy3.mock.calls[ 0 ][ 0 ].deps.prev[ 1 ]).toBe(result2);
        expect(spy1.mock.calls[ 0 ][ 0 ].deps.prev).not.toBe(spy2.mock.calls[ 0 ][ 0 ].deps.prev);
        expect(spy2.mock.calls[ 0 ][ 0 ].deps.prev).not.toBe(spy3.mock.calls[ 0 ][ 0 ].deps.prev);
        expect(result).toBe(result3);
    });

    it('first block throws', async() => {
        let error;
        const block1 = de.func({
            block: () => {
                error = de.error({
                    id: 'ERROR',
                });
                throw error;
            },
        });

        const spy2 = jest.fn<any, any>();
        const block2 = de.func({
            block: spy2,
        });

        const block = de.pipe({
            block: [ block1, block2 ],
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(e).toBe(error);
            expect(spy2.mock.calls).toHaveLength(0);
        }
    });

    it('second block throws', async() => {
        const spy1 = jest.fn();
        const block1 = de.func({
            block: spy1,
        });

        let error;
        const block2 = de.func({
            block: () => {
                error = de.error({
                    id: 'ERROR',
                });
                throw error;
            },
        });

        const block = de.pipe({
            block: [ block1, block2 ],
        });

        expect.assertions(2);
        try {
            await de.run(block);

        } catch (e) {
            expect(e).toBe(error);
            expect(spy1.mock.calls).toHaveLength(1);
        }
    });

});
