const http_ = require( 'http' );

const de = require( '../lib' );

const Server = require( './server' );

//  ---------------------------------------------------------------------------------------------------------------  //

let _path_index = 1;
function get_path() {
    return `/test/${ _path_index++ }`;
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'http', () => {

    const PORT = 9000;

    const base_block = de.http( {
        block: {
            protocol: 'http:',
            host: '127.0.0.1',
            port: PORT,
            with_meta: true,
        },
    } );

    const fake = new Server( {
        module: http_,
        port: PORT,
    } );

    beforeAll( () => fake.start() );
    afterAll( () => fake.stop() );

    it( 'basic block', async () => {
        const path = get_path();

        const CONTENT = 'Привет!';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        const block = base_block( {
            block: {
                path: path,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.status_code ).toBe( 200 );
        expect( result.result ).toBe( CONTENT );
    } );

} );

