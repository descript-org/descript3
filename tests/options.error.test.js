const de = require( '../lib' );

const {
    get_result_block,
    get_error_block,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'options.error', () => {

    it( 'receives { params, context, error }', async () => {
        const error = de.error( {
            id: 'ERROR',
        } );
        const spy = jest.fn( () => null );
        const block = get_error_block( error )( {
            options: {
                error: spy,
            },
        } );

        const params = {
            id: 42,
        };
        const context = {
            context: true,
        };
        await de.run( block, { params, context } );

        const arg = spy.mock.calls[ 0 ][ 0 ];
        expect( arg.params ).toBe( params );
        expect( arg.context ).toBe( context );
        expect( arg.error ).toBe( error );
    } );

    it( 'never called if block successful', async () => {
        const block_result = {
            foo: 42,
        };
        const spy = jest.fn();
        const block = get_result_block( block_result )( {
            options: {
                error: spy,
            },
        } );

        await de.run( block );

        expect( spy.mock.calls ).toHaveLength( 0 );
    } );

    it( 'returns another error', async () => {
        //  Нужно делать throw, а не кидать ошибку.
        //  Просто return de.error( ... ) не приводит к ошибке на самом деле.

        const error_1 = de.error( {
            id: 'ERROR_1',
        } );
        const error_2 = de.error( {
            id: 'ERROR_2',
        } );
        const block = get_error_block( error_1 )( {
            options: {
                error: () => error_2,
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( error_2 );
    } );

    it( 'throws ReferenceError', async () => {
        const error_1 = de.error( {
            id: 'ERROR_1',
        } );
        const spy = jest.fn( () => {
            //  eslint-disable-next-line no-undef
            return x;
        } );
        const block = get_error_block( error_1 )( {
            options: {
                error: spy,
            },
        } );

        expect.assertions( 3 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( 'ReferenceError' );
            expect( spy.mock.calls ).toHaveLength( 1 );
        }
    } );

    it( 'throws de.error', async () => {
        const error_1 = de.error( {
            id: 'ERROR_1',
        } );
        let error_2;
        const spy = jest.fn( () => {
            error_2 = de.error( {
                id: 'ERROR_2',
            } );

            throw error_2;
        } );
        const block = get_error_block( error_1 )( {
            options: {
                error: spy,
            },
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( error_2 );
            expect( spy.mock.calls ).toHaveLength( 1 );
        }
    } );

    it.each( [ { foo: 42 }, 0, '', null, false ] )( 'returns %j', async ( value ) => {
        const error = de.error( {
            id: 'ERROR',
        } );
        const block = get_error_block( error )( {
            options: {
                error: () => value,
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( value );
    } );

    it( 'returns undefined', async () => {
        const error = de.error( {
            id: 'ERROR',
        } );
        const spy = jest.fn( () => undefined );
        const block = get_error_block( error )( {
            options: {
                error: spy,
            },
        } );

        const result = await de.run( block );
        expect( result ).toBe( undefined );
    } );

    it.each( [ { foo: 42 }, 0, '', null, false, undefined ] )( 'first returns %j, second never called', async ( value ) => {
        const error = de.error( {
            id: 'ERROR',
        } );
        const spy = jest.fn();
        const block_1 = get_error_block( error )( {
            options: {
                error: () => value,
            },
        } );
        const block_2 = block_1( {
            options: {
                error: spy,
            },
        } );

        const result = await de.run( block_2 );

        expect( result ).toBe( value );
        expect( spy.mock.calls ).toHaveLength( 0 );
    } );

    it( 'first throws, second gets error from first', async () => {
        const error_1 = de.error( {
            id: 'ERROR',
        } );
        const error_2 = de.error( {
            id: 'ANOTHER_ERROR',
        } );
        const block_1 = get_error_block( error_1, 50 )( {
            options: {
                error: () => {
                    throw error_2;
                },
            },
        } );
        const spy = jest.fn( () => null );
        const block_2 = block_1( {
            options: {
                error: spy,
            },
        } );

        await de.run( block_2 );

        expect( spy.mock.calls[ 0 ][ 0 ].error ).toBe( error_2 );
    } );

} );

