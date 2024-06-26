const de = require( '../lib' );

const {
    wait_for_value,
    //  wait_for_error,
    get_result_block,
    get_error_block,
} = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'de.func', () => {

    it( 'resolves with value', async () => {
        const data = {
            foo: 42,
        };

        const block = get_result_block( data, 50 );

        const result = await de.run( block );

        expect( result ).toBe( data );
    } );

    it( 'resolves with promise', async () => {
        const data = {
            foo: 42,
        };

        const block = de.func( {
            block: function() {
                return wait_for_value( data, 50 );
            },
        } );

        const result = await de.run( block );

        expect( result ).toBe( data );
    } );

    it( 'resolves with block', async () => {
        const data = {
            foo: 42,
        };

        const block1 = get_result_block( data, 50 );
        const block2 = get_result_block( block1, 50 );

        const result = await de.run( block2 );

        expect( result ).toBe( data );
    } );

    //  Самый простой способ вычислить факториал!
    it( 'recursion', async () => {
        const block = de.func( {
            block: ( { params } ) => {
                if ( params.n === 1 ) {
                    return 1;

                } else {
                    return block( {
                        options: {
                            params: ( { params } ) => {
                                return {
                                    n: params.n - 1,
                                };
                            },
                            after: ( { result, params } ) => {
                                return ( params.n + 1 ) * result;
                            },
                        },
                    } );
                }
            },
        } );

        const params = {
            n: 5,
        };
        const result = await de.run( block, { params } );
        expect( result ).toBe( 120 );
    } );

    it( 'rejects with de.error', async () => {
        const error = de.error( {
            id: 'SOME_ERROR',
        } );

        const block = get_error_block( error, 50 );

        expect.assertions( 1 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
        }

    } );

    it( 'cancellable', async () => {
        const block = get_result_block( null, 100 );
        const cancel = new de.Cancel();

        const cancel_reason = de.error( {
            id: 'SOME_REASON',
        } );
        setTimeout( () => {
            cancel.cancel( cancel_reason );
        }, 50 );

        expect.assertions( 1 );
        try {
            await de.run( block, { cancel } );

        } catch ( error ) {
            expect( error ).toBe( cancel_reason );
        }
    } );

} );

