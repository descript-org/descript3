import stripNullAndUndefinedValues from '../lib/stripNullAndUndefinedValues';

describe('stripNullAndUndefinedValues', () => {

    it('returns copy', () => {
        const obj = {
            a: 'a',
            b: 'b',
        };
        const stripped = stripNullAndUndefinedValues(obj);

        expect(stripped).toStrictEqual(obj);
        expect(stripped).not.toBe(obj);
    });

    it('strip null and undefined', () => {
        const obj = {
            a: undefined,
            b: null,
            c: 0,
            d: '',
            e: false,
        };
        const stripped = stripNullAndUndefinedValues(obj);

        expect(stripped).toStrictEqual({
            c: 0,
            d: '',
            e: false,
        });
    });

});
