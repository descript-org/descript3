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
    context = context || new de.Context();
    cancel = cancel || new de.Cancel();

    return request( { ...DEFAULT_OPTIONS, ...options }, context, cancel );
}

let _path_index = 1;
function get_path() {
    return `/test/${ _path_index++ }`;
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'request', () => {

    const fake = new Fake( config );
    beforeAll( () => fake.start() );
    afterAll( () => fake.stop() );

    it( 'get', async () => {
        const path = get_path();

        const CONTENT = 'Hello';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        const result = await do_request( {
            path: path,
        } );

        expect( result.status_code ).toBe( 200 );
        expect( Buffer.isBuffer( result.body ) ).toBe( true );
        expect( result.body.toString() ).toBe( CONTENT );
    } );

    it( 'invalid protocol', async () => {
        const path = get_path();

        const CONTENT = 'Hello';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        expect.assertions( 1 );
        try {
            await do_request( {
                protocol: 'http',
                path: path,
            } );

        } catch ( error ) {
            expect( de.is_error( error ) ).toBe( true );
        }
    } );
} );

