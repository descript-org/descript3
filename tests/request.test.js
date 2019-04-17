const de = require( '../lib' );
const request = require( '../lib/request' );
const Fake = require( './fake' );

//  ---------------------------------------------------------------------------------------------------------------  //

const config = {
    port: 9000,
};

const DEFAULT_OPTIONS = {
    protocol: 'http:',
    host: '127.0.0.1',
    port: config.port,
    path: '/',
};

function do_request( options, context, cancel ) {
    return request( { ...DEFAULT_OPTIONS, ...options }, context, cancel );
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'request', () => {

    const fake = new Fake( config );
    beforeAll( () => fake.start() );
    afterAll( () => fake.stop() );

    let n = 1;

    it( 'get', async () => {
        const path = `/get/${ n++ }/`;

        const CONTENT = 'Hello';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        const context = new de.Context();
        const cancel = new de.Cancel();
        const result = await do_request( {
            path: path,
        }, context, cancel );

        expect( result.status_code ).toBe( 200 );
        expect( Buffer.isBuffer( result.body ) ).toBe( true );
        expect( result.body.toString() ).toBe( CONTENT );
    } );

} );

