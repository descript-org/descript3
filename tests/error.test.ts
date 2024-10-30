/* eslint-disable no-console */
/* eslint-disable jest/no-conditional-expect */

import fs_ from 'fs';

import * as de from '../lib';

describe('de.error', () => {

    it('from string', () => {
        const errorId = 'SOME_ERROR';
        const error = de.error(errorId);

        expect(error.error.id).toBe(errorId);
    });

    it('from ReferenceError', () => {
        expect.assertions(1);
        try {
            //  eslint-disable-next-line
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const a = b;

        } catch (e) {
            const error = de.error(e);
            console.log(e);
            expect(error.error.id).toBe('ReferenceError');
        }

    });

    it('from TypeError', () => {
        expect.assertions(1);
        try {
            const b = null;
            // eslint-disable-next-line no-unused-vars,@typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const a = b.foo;

        } catch (e) {
            const error = de.error(e);

            expect(error.error.id).toBe('TypeError');
        }

    });

    //  https://github.com/facebook/jest/issues/2549
    //
    it('from nodejs exception', () => {
        const filename = 'some_nonexistance_filename';

        expect.assertions(4);
        try {
            fs_.readFileSync(filename, 'utf-8');

        } catch (e) {
            // some bug in jest
            // eslint-disable-next-line no-ex-assign
            const err = new Error(e);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            Object.keys(e).forEach(key => err[key] = e[key]);
            const error = de.error(err);

            expect(error.error.id).toBe('UNKNOWN_ERROR');
            expect(error.error.code).toBe('ENOENT');
            expect(error.error.syscall).toBe('open');
            //  FIXME: Может лучше .toBeDefined() использовать?
            expect(error.error.errno).toBe(-2);
        }
    });

    it('de.is_error #1', () => {
        const error = de.error('id');

        expect(de.isError(error)).toBe(true);
    });

    it('de.is_error #2', () => {
        const id = de.ERROR_ID.PARSE_BODY_ERROR;
        const error = de.error({
            id: id,
        });

        expect(de.isError(error, id)).toBe(true);
        expect(de.isError(error, de.ERROR_ID.INVALID_DEPS_ID)).toBe(false);
    });

});
