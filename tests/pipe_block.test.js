const de = require( '../lib' );

describe( 'de.pipe', () => {

    it( 'all blocks are successful', async () => {
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

        let result_2;
        const spy_2 = jest.fn( () => {
            result_2 = {
                b: 2,
            };
            return result_2;
        } );
        const block_2 = de.func( {
            block: spy_2,
        } );

        let result_3;
        const spy_3 = jest.fn( () => {
            result_3 = {
                c: 3,
            };
            return result_3;
        } );
        const block_3 = de.func( {
            block: spy_3,
        } );

        const block = de.pipe( {
            block: [ block_1, block_2, block_3 ],
        } );

        const result = await de.run( block );

        expect( spy_1.mock.calls[ 0 ][ 0 ].deps.prev ).toEqual( [] );
        expect( spy_2.mock.calls[ 0 ][ 0 ].deps.prev.length ).toBe( 1 );
        expect( spy_2.mock.calls[ 0 ][ 0 ].deps.prev[ 0 ] ).toBe( result_1 );
        expect( spy_3.mock.calls[ 0 ][ 0 ].deps.prev.length ).toBe( 2 );
        expect( spy_3.mock.calls[ 0 ][ 0 ].deps.prev[ 0 ] ).toBe( result_1 );
        expect( spy_3.mock.calls[ 0 ][ 0 ].deps.prev[ 1 ] ).toBe( result_2 );
        expect( spy_1.mock.calls[ 0 ][ 0 ].deps.prev ).not.toBe( spy_2.mock.calls[ 0 ][ 0 ].deps.prev );
        expect( spy_2.mock.calls[ 0 ][ 0 ].deps.prev ).not.toBe( spy_3.mock.calls[ 0 ][ 0 ].deps.prev );
        expect( result ).toBe( result_3 );
    } );

    it( 'first block throws', async () => {
        let error;
        const block_1 = de.func( {
            block: () => {
                error = de.error( {
                    id: 'ERROR',
                } );
                throw error;
            },
        } );

        const spy_2 = jest.fn();
        const block_2 = de.func( {
            block: spy_2,
        } );

        const block = de.pipe( {
            block: [ block_1, block_2 ],
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
            expect( spy_2.mock.calls.length ).toBe( 0 );
        }
    } );

    it( 'second block throws', async () => {
        const spy_1 = jest.fn();
        const block_1 = de.func( {
            block: spy_1,
        } );

        let error;
        const block_2 = de.func( {
            block: () => {
                error = de.error( {
                    id: 'ERROR',
                } );
                throw error;
            },
        } );

        const block = de.pipe( {
            block: [ block_1, block_2 ],
        } );

        expect.assertions( 2 );
        try {
            await de.run( block );

        } catch ( e ) {
            expect( e ).toBe( error );
            expect( spy_1.mock.calls.length ).toBe( 1 );
        }
    } );

} );

