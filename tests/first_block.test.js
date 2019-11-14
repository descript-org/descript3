const de = require( '../lib' );

describe( 'de.first', () => {

    it( 'first block is successful', async () => {
        let result_1;
        const spy_1 = jest.fn( () => {
            result_1 = {
                a: 1,
            };
            return result_1;
        } );
        const block_1 = de.func( {
            block: spy_1,
        } );

        const spy_2 = jest.fn();
        const block_2 = de.func( {
            block: spy_2,
        } );

        const block = de.first( {
            block: [ block_1, block_2 ],
        } );

        const result = await de.run( block );

        expect( result ).toBe( result_1 );
        expect( spy_1.mock.calls[ 0 ][ 0 ].deps.prev ).toEqual( [] );
        expect( spy_2.mock.calls.length ).toEqual( 0 );
    } );

    it( 'first block throws', async () => {
        let error_1;
        const spy_1 = jest.fn( () => {
            error_1 = de.error( {
                id: 'ERROR',
            } );
            throw error_1;
        } );
        const block_1 = de.func( {
            block: spy_1,
        } );

        let result_2;
        const spy_2 = jest.fn( () => {
            result_2 = {
                a: 1,
            };
            return result_2;
        } );
        const block_2 = de.func( {
            block: spy_2,
        } );

        const block = de.first( {
            block: [ block_1, block_2 ],
        } );

        const result = await de.run( block );

        expect( result ).toBe( result_2 );
        expect( spy_2.mock.calls[ 0 ][ 0 ].deps.prev.length ).toBe( 1 );
        expect( spy_2.mock.calls[ 0 ][ 0 ].deps.prev[ 0 ] ).toBe( error_1 );
    } );

    it( 'second block throws', async () => {
        let error_1;
        const spy_1 = jest.fn( () => {
            error_1 = de.error( {
                id: 'ERROR',
            } );
            throw error_1;
        } );
        const block_1 = de.func( {
            block: spy_1,
        } );

        let error_2;
        const block_2 = de.func( {
            block: () => {
                error_2 = de.error( {
                    id: 'ANOTHER_ERROR',
                } );
                throw error_2;
            },
        } );

        const block = de.first( {
            block: [ block_1, block_2 ],
        } );

        expect.assertions( 5 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( de.is_error( e ) ).toBe( true );
            expect( e.error.id ).toBe( de.ERROR_ID.ALL_BLOCKS_FAILED );
            expect( e.error.reason.length ).toBe( 2 );
            expect( e.error.reason[ 0 ] ).toBe( error_1 );
            expect( e.error.reason[ 1 ] ).toBe( error_2 );
        }
    } );

} );

