import * as de from '../lib';
//  ---------------------------------------------------------------------------------------------------------------  //

describe('de.Cancel', () => {

    it('cancel', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe(spy);

        const error = de.error('SOME_ERROR');
        cancel.cancel(error);

        expect(spy.mock.calls[ 0 ][ 0 ]).toBe(error);
    });

    it('cancel with plain object', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe(spy);

        const error = 'SOME_ERROR';
        cancel.cancel(error);

        const reason = spy.mock.calls[ 0 ][ 0 ];
        expect(de.isError(reason)).toBe(true);
        expect(reason.error.id).toBe(error);
    });

    it('cancel after cancel', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe(spy);

        const error1 = de.error('SOME_ERROR_1');
        cancel.cancel(error1);
        const error2 = de.error('SOME_ERROR_2');
        cancel.cancel(error2);

        expect(spy.mock.calls).toHaveLength(1);
    });

    it('cancel after close', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe(spy);

        cancel.close();

        const error = de.error('SOME_ERROR');
        cancel.cancel(error);

        expect(spy.mock.calls).toHaveLength(0);
    });

    it('throw_if_cancelled #1', () => {
        const cancel = new de.Cancel();

        const error = de.error('SOME_ERROR');
        cancel.cancel(error);

        expect.assertions(1);
        let err;
        try {
            cancel.throwIfCancelled();

        } catch (e) {
            err = e;
        }

        expect(error).toBe(err);
    });

    it('throw_if_cancelled #2', () => {
        expect(() => {
            const cancel = new de.Cancel();
            cancel.throwIfCancelled();
        }).not.toThrow();
    });

    it('subscribe after close', () => {
        const cancel = new de.Cancel();

        cancel.close();

        const spy = jest.fn();
        cancel.subscribe(spy);

        expect(spy.mock.calls).toHaveLength(0);
    });

    it('subscribe after cancel', () => {
        const cancel = new de.Cancel();

        const error = de.error('SOME_ERROR');
        cancel.cancel(error);

        const spy = jest.fn();
        cancel.subscribe(spy);

        expect(spy.mock.calls[ 0 ][ 0 ]).toBe(error);
    });

    it('get_promise', async() => {
        const cancel = new de.Cancel();

        const promise = cancel.getPromise();

        const error = de.error('SOME_ERROR');
        setTimeout(() => {
            cancel.cancel(error);
        }, 50);

        expect.assertions(1);
        let err;
        try {
            await promise;

        } catch (e) {
            err = e;
        }

        expect(err).toBe(error);
    });

    it('get_promise after cancel', async() => {
        const cancel = new de.Cancel();

        const error = de.error('SOME_ERROR');
        cancel.cancel(error);

        expect.assertions(1);
        let err;
        try {
            await cancel.getPromise();

        } catch (e) {
            err = e;
        }

        expect(err).toBe(error);
    });

    it('child canceled after parent cancel', () => {
        const parentCancel = new de.Cancel();
        const childCancel = parentCancel.create();

        const spy = jest.fn();
        childCancel.subscribe(spy);

        const error = de.error('SOME_ERROR');
        parentCancel.cancel(error);

        expect(spy.mock.calls[ 0 ][ 0 ]).toBe(error);
    });

    it('child closed if parent was closed #1', () => {
        const parentCancel = new de.Cancel();
        parentCancel.close();
        const childCancel = parentCancel.create();

        const spy = jest.fn();
        childCancel.subscribe(spy);

        const error = de.error('SOME_ERROR');
        parentCancel.cancel(error);

        expect(spy.mock.calls).toHaveLength(0);
    });

    it('child closed if parent was closed #2', () => {
        const parentCancel = new de.Cancel();
        parentCancel.close();
        const childCancel = parentCancel.create();

        const spy = jest.fn();
        childCancel.subscribe(spy);

        const error = de.error('SOME_ERROR');
        childCancel.cancel(error);

        expect(spy.mock.calls).toHaveLength(0);
    });

    it('child cancelled if parent was cancelled #1', () => {
        const parentCancel = new de.Cancel();
        const error = de.error('SOME_ERROR');
        parentCancel.cancel(error);

        const childCancel = parentCancel.create();

        const spy = jest.fn();
        childCancel.subscribe(spy);

        expect(spy.mock.calls[ 0 ][ 0 ]).toBe(error);
    });

});
