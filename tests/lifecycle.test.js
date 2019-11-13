const de = require( '../lib' );

describe( 'lifecycle', () => {

    it( 'inheritance', async () => {
        let action_result;
        const action_spy = jest.fn( () => {
            action_result = {
                a: 1,
            };
            return action_result;
        } );

        let parent_params_result;
        const parent_params_spy = jest.fn( () => {
            parent_params_result = {
                b: 2,
            };
            return parent_params_result;
        } );

        const parent_before_spy = jest.fn();

        let parent_after_result;
        const parent_after_spy = jest.fn( () => {
            parent_after_result = {
                c: 3,
            };
            return parent_after_result;
        } );

        const parent = de.func( {
            block: action_spy,
            options: {
                params: parent_params_spy,
                before: parent_before_spy,
                after: parent_after_spy,
            },
        } );

        let child_params_result;
        const child_params_spy = jest.fn( () => {
            child_params_result = {
                d: 4,
            };
            return child_params_result;
        } );

        const child_before_spy = jest.fn();

        let child_after_result;
        const child_after_spy = jest.fn( () => {
            child_after_result = {
                e: 5,
            };
            return child_after_result;
        } );

        const child = parent( {
            options: {
                params: child_params_spy,
                before: child_before_spy,
                after: child_after_spy,
            },
        } );

        const params = {
            foo: 42,
        };
        const result = await de.run( child, { params } );

        expect( child_params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( params );
        expect( child_before_spy.mock.calls[ 0 ][ 0 ].params ).toBe( child_params_result );
        expect( parent_params_spy.mock.calls[ 0 ][ 0 ].params ).toBe( child_params_result );
        expect( parent_before_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params_result );
        expect( action_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params_result );
        expect( parent_after_spy.mock.calls[ 0 ][ 0 ].params ).toBe( parent_params_result );
        expect( parent_after_spy.mock.calls[ 0 ][ 0 ].result ).toBe( action_result );
        expect( child_after_spy.mock.calls[ 0 ][ 0 ].params ).toBe( child_params_result );
        expect( child_after_spy.mock.calls[ 0 ][ 0 ].result ).toBe( parent_after_result );
        expect( result ).toBe( child_after_result );
    } );

} );

