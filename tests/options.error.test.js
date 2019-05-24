const de = require( '../lib' );

const {
    //  wait_for_value,
    //  wait_for_error,
    //  get_result_block,
    get_error_block,
    //  get_timeout,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.error', () => {

    it( 'returns another error', async () => {
        const error_1 = de.error( {
            id: 'SOME_ERROR_1',
        } );
        const error_2 = de.error( {
            id: 'SOME_ERROR_2',
        } );
        const spy = jest.fn( () => error_2 );
        const block = get_error_block( error_1 )( {
            options: {
                error: spy,
            },
        } );

        expect.assertions( 2 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( error_2 );
            expect( spy.mock.calls[ 0 ][ 0 ].error ).toBe( error_1 );
        }
    } );

    it( 'returns not error', async () => {
        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        const data = {
            foo: 42,
        };
        const spy = jest.fn( () => data );
        const block = get_error_block( error )( {
            options: {
                error: spy,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( data );
    } );

    it.each( [ 0, '', null, false ] )( 'returns %j', async ( value ) => {
        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        const spy = jest.fn( () => value );
        const block = get_error_block( error )( {
            options: {
                error: spy,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result ).toBe( value );
    } );

    it( 'returns undefined', async () => {
        const error = de.error( {
            id: 'SOME_ERROR',
        } );
        const spy = jest.fn( () => undefined );
        const block = get_error_block( error )( {
            options: {
                error: spy,
            },
        } );

        expect.assertions( 1 );
        try {
            const context = new de.Context();
            await context.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
        }
    } );

} );

