import isPlainObject from '../lib/isPlainObject';

describe('isPlainObject', () => {

    it.each([ null, undefined, 'Hello' ])('%j', (obj) => {
        expect(isPlainObject(obj)).toBe(false);
    });

    it('{}', () => {
        const obj = {
            foo: 42,
        };

        expect(isPlainObject(obj)).toBe(true);
    });

    it('Object.create(null)', () => {
        const obj = Object.create(null);

        expect(isPlainObject(obj)).toBe(true);
    });

    it('instanceof Foo', () => {
        const Foo = function() {
            //  Do nothing.
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const obj = new Foo();

        expect(isPlainObject(obj)).toBe(false);
    });

});
