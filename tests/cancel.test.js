const de = require( '../lib' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'de.Cancel', () => {

    test( 'cancel', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe( spy );

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        cancel.cancel( error );

        expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( error );
    } );

    test( 'cancel with plain object', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe( spy );

        const error = {
            id: 'SOME_ERROR',
        };
        cancel.cancel( error );

        const reason = spy.mock.calls[ 0 ][ 0 ];
        expect( de.is_error( reason ) ).toBe( true );
        expect( reason.error.id ).toBe( error.id );
    } );

    test( 'cancel after cancel', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe( spy );

        const error1 = de.error( {
            id: 'SOME_ERROR_1',
        } );
        cancel.cancel( error1 );
        const error2 = de.error( {
            id: 'SOME_ERROR_2',
        } );
        cancel.cancel( error2 );

        expect( spy.mock.calls.length ).toBe( 1 );
    } );

    test( 'cancel after close', () => {
        const cancel = new de.Cancel();

        const spy = jest.fn();
        cancel.subscribe( spy );

        cancel.close();

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        cancel.cancel( error );

        expect( spy.mock.calls.length ).toBe( 0 );
    } );

    test( 'throw_if_cancelled #1', () => {
        const cancel = new de.Cancel();

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        cancel.cancel( error );

        expect.assertions( 1 );
        try {
            cancel.throw_if_cancelled();

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

    test( 'throw_if_cancelled #2', () => {
        const cancel = new de.Cancel();

        cancel.throw_if_cancelled();
    } );

    test( 'subscribe after close', () => {
        const cancel = new de.Cancel();

        cancel.close();

        const spy = jest.fn();
        cancel.subscribe( spy );

        expect( spy.mock.calls.length ).toBe( 0 );
    } );

    test( 'subscribe after cancel', () => {
        const cancel = new de.Cancel();

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        cancel.cancel( error );

        const spy = jest.fn();
        cancel.subscribe( spy );

        expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( error );
    } );

    test( 'get_promise', async () => {
        const cancel = new de.Cancel();

        const promise = cancel.get_promise();

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        setTimeout( () => {
            cancel.cancel( error );
        }, 50 );

        expect.assertions( 1 );
        try {
            await promise;

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

    test( 'get_promise after cancel', async () => {
        const cancel = new de.Cancel();

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        cancel.cancel( error );

        expect.assertions( 1 );
        try {
            await cancel.get_promise();

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

    test( 'child canceled after parent cancel', () => {
        const parent_cancel = new de.Cancel();
        const child_cancel = parent_cancel.create();

        const spy = jest.fn();
        child_cancel.subscribe( spy );

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        parent_cancel.cancel( error );

        expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( error );
    } );

    test( 'child closed if parent was closed #1', () => {
        const parent_cancel = new de.Cancel();
        parent_cancel.close();
        const child_cancel = parent_cancel.create();

        const spy = jest.fn();
        child_cancel.subscribe( spy );

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        parent_cancel.cancel( error );

        expect( spy.mock.calls.length ).toBe( 0 );
    } );

    test( 'child closed if parent was closed #2', () => {
        const parent_cancel = new de.Cancel();
        parent_cancel.close();
        const child_cancel = parent_cancel.create();

        const spy = jest.fn();
        child_cancel.subscribe( spy );

        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        child_cancel.cancel( error );

        expect( spy.mock.calls.length ).toBe( 0 );
    } );

    test( 'child cancelled if parent was cancelled #1', () => {
        const parent_cancel = new de.Cancel();
        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        parent_cancel.cancel( error );

        const child_cancel = parent_cancel.create();

        const spy = jest.fn();
        child_cancel.subscribe( spy );

        expect( spy.mock.calls[ 0 ][ 0 ] ).toBe( error );
    } );

} );

