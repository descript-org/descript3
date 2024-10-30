import * as de from '../lib';

describe('descript', () => {

    /*it('de.run( value )', async() => {
        const block = {
            foo: 42,
        };

        const result = await de.run(block);
        expect(result).toBe(block);
    });*/

    const cases: Array<[string, (...args: Array<any>) => any]> = [
        [ 'de.func', de.func ],
        [ 'de.array', de.array ],
        [ 'de.object', de.object ],
        //[ 'de.pipe', de.pipe ],
        //[ 'de.first', de.first ],
    ];

    cases.forEach((data) => {
        it(`${ data[0] } without arguments`, () => {
            const factory = data[1];
            expect.assertions(2);
            let err;
            try {
                factory({
                    block: 1,
                });

            } catch (e) {
                err = e;
            }

            expect(de.isError(err)).toBe(true);
            expect(err.error.id).toBe(de.ERROR_ID.INVALID_BLOCK);
        });
    });

    it('de.http without arguments', () => {
        expect(() => de.http({
            block: {},
            options: {},
        })).not.toThrow();
    });

});
