const url_ = require( 'url' );
const qs_ = require( 'querystring' );
const path_ = require( 'path' );
const fs_ = require( 'fs' );
const http_ = require( 'http' );
const https_ = require( 'https' );
const zlib_ = require( 'zlib' );

const de = require( '../lib' );
const request = require( '../lib/request' );
const Server = require( './server' );

//  ---------------------------------------------------------------------------------------------------------------  //

let _path_index = 1;
function get_path() {
    return `/test/${ _path_index++ }`;
}

function get_do_request( default_options ) {
    return function do_request( options, context, cancel ) {
        context = context || new de.Context();
        cancel = cancel || new de.Cancel();

        return request( { ...default_options, ...options }, context, cancel );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'request', () => {

    describe( 'http', () => {

        const PORT = 9001;

        const do_request = get_do_request( {
            protocol: 'http:',
            host: '127.0.0.1',
            port: PORT,
            path: '/',
        } );

        const fake = new Server( {
            module: http_,
            port: PORT,
        } );

        beforeAll( () => fake.start() );
        afterAll( () => fake.stop() );

        it.each( [ 'GET', 'DELETE' ] )( '%j', async ( method ) => {
            const path = get_path();

            const CONTENT = 'Привет!';

            fake.add( path, {
                status_code: 200,
                content: CONTENT,
            } );

            const result = await do_request( {
                method: method,
                path: path,
            } );

            expect( result.status_code ).toBe( 200 );
            expect( Buffer.isBuffer( result.body ) ).toBe( true );
            expect( result.body.toString() ).toBe( CONTENT );
        } );

        it( 'sets accept-encoding to gzip,deflate', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                path: path,
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            expect( req.headers[ 'accept-encoding' ] ).toBe( 'gzip,deflate' );
        } );

        it( 'adds gzip,deflate to accept-encoding', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                path: path,
                headers: {
                    'accept-encoding': 'compress',
                },
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            expect( req.headers[ 'accept-encoding' ] ).toBe( 'gzip,deflate,compress' );
        } );

        it( 'sends lower-cased headers', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                path: path,
                headers: {
                    'x-request-foo': 'Foo',
                    'X-REQUEST-BAR': 'bAr',
                    'X-Request-Quu': 'quU',
                },
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            expect( req.headers[ 'x-request-foo' ] ).toBe( 'Foo' );
            expect( req.headers[ 'x-request-bar' ] ).toBe( 'bAr' );
            expect( req.headers[ 'x-request-quu' ] ).toBe( 'quU' );
        } );

        it( 'query', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const QUERY = {
                foo: 42,
                bar: 'Привет!',
            };

            await do_request( {
                path: path,
                query: QUERY,
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            expect( url_.parse( req.url, true ).search ).toEqual( '?' + qs_.stringify( QUERY ) );
        } );

        it( 'basic auth', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            const AUTH = 'user:password';

            fake.add( path, spy );

            await do_request( {
                path: path,
                auth: AUTH,
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            const auth_header = req.headers[ 'authorization' ].replace( /^Basic\s*/, '' );
            expect( Buffer.from( auth_header, 'base64' ).toString() ).toBe( AUTH );
        } );

        it( 'invalid protocol', async () => {
            const path = get_path();

            const CONTENT = 'Привет!';

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

        it.each( [ 'POST', 'PUT', 'PATCH' ] )( '%j, body is a Buffer', async ( method ) => {
            const path = get_path();

            const BODY = Buffer.from( 'Привет!' );

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                path: path,
                body: BODY,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'application/octet-stream' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( BODY.length );
            expect( Buffer.compare( BODY, body ) ).toBe( 0 );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH' ] )( '%j, body is a string', async ( method ) => {
            const path = get_path();

            const BODY = 'Привет!';

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                path: path,
                body: BODY,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'text/plain' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( Buffer.byteLength( BODY ) );
            expect( body.toString() ).toBe( BODY );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH' ] )( '%j, body is a string, custom content-type', async ( method ) => {
            const path = get_path();

            const BODY = 'div { color: red; }';

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                path: path,
                body: BODY,
                headers: {
                    'content-type': 'text/css',
                },
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'text/css' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( Buffer.byteLength( BODY ) );
            expect( body.toString() ).toBe( BODY );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH' ] )( '%j, body is an object', async ( method ) => {
            const path = get_path();

            const BODY = {
                id: 42,
                text: 'Привет!',
            };

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                path: path,
                body: BODY,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];
            const body_string = qs_.stringify( BODY );

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'application/x-www-form-urlencoded' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( Buffer.byteLength( body_string ) );
            expect( body.toString() ).toBe( body_string );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH' ] )( '%j, body is an object, content-type is application/json', async ( method ) => {
            const path = get_path();

            const BODY = {
                id: 42,
                text: 'Привет!',
            };

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                path: path,
                body: BODY,
                headers: {
                    'content-type': 'application/json',
                },
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];
            const body_string = JSON.stringify( BODY );

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'application/json' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( Buffer.byteLength( body_string ) );
            expect( body.toString() ).toBe( body_string );
        } );

        describe( 'errors', () => {

            describe( '2xx', () => {

                it( 'custom is_error', async () => {
                    const path = get_path();

                    fake.add( path, {
                        status_code: 200,
                    } );

                    expect.assertions( 2 );
                    try {
                        await do_request( {
                            path: path,
                            is_error: () => true,
                        } );

                    } catch ( error ) {
                        expect( de.is_error( error ) ).toBe( true );
                        expect( error.error.status_code ).toBe( 200 );
                    }
                } );

            } );

            describe( '4xx', () => {
                const status_code = 404;

                it( 'max_retries=1', async () => {
                    const path = get_path();

                    const spy = jest.fn( ( res ) => res.end() );

                    fake.add( path, [
                        {
                            status_code: status_code,
                        },
                        spy,
                    ] );

                    expect.assertions( 3 );
                    try {
                        await do_request( {
                            path: path,
                            max_retries: 1,
                        } );

                    } catch ( error ) {
                        expect( de.is_error( error ) ).toBe( true );
                        expect( error.error.status_code ).toBe( status_code );
                        expect( spy.mock.calls.length ).toBe( 0 );
                    }
                } );

                it( 'max_retries=1 with custom is_retry_allowed', async () => {
                    const path = get_path();

                    const CONTENT = 'Привет!';
                    fake.add( path, [
                        {
                            status_code: status_code,
                        },
                        {
                            status_code: 200,
                            content: CONTENT,
                        },
                    ] );

                    const result = await do_request( {
                        path: path,
                        max_retries: 1,
                        is_retry_allowed: () => true,
                    } );

                    expect( result.status_code ).toBe( 200 );
                    expect( result.body.toString() ).toBe( CONTENT );
                } );

            } );

            describe( '5xx', () => {
                const status_code = 503;

                it( 'max_retries=0', async () => {
                    const path = get_path();

                    const spy = jest.fn( ( res ) => res.end() );

                    fake.add( path, [
                        {
                            status_code: status_code,
                        },
                        spy,
                    ] );

                    expect.assertions( 3 );
                    try {
                        await do_request( {
                            path: path,
                            max_retries: 0,
                        } );

                    } catch ( error ) {
                        expect( de.is_error( error ) ).toBe( true );
                        expect( error.error.status_code ).toBe( status_code );
                        expect( spy.mock.calls.length ).toBe( 0 );
                    }
                } );

                it( 'max_retries=1 with custom is_retry_allowed', async () => {
                    const path = get_path();

                    const spy = jest.fn( ( res ) => res.end() );

                    fake.add( path, [
                        {
                            status_code: status_code,
                        },
                        spy,
                    ] );

                    expect.assertions( 3 );
                    try {
                        await do_request( {
                            path: path,
                            max_retries: 1,
                            is_retry_allowed: () => false,
                        } );

                    } catch ( error ) {
                        expect( de.is_error( error ) ).toBe( true );
                        expect( error.error.status_code ).toBe( status_code );
                        expect( spy.mock.calls.length ).toBe( 0 );
                    }
                } );

                it( 'max_retries=1', async () => {
                    const path = get_path();

                    const CONTENT = 'Привет!';
                    fake.add( path, [
                        {
                            status_code: status_code,
                        },
                        {
                            status_code: 200,
                            content: CONTENT,
                        },
                    ] );

                    const result = await do_request( {
                        path: path,
                        max_retries: 1,
                    } );

                    expect( result.status_code ).toBe( 200 );
                    expect( result.body.toString() ).toBe( CONTENT );
                } );

            } );

            it( 'timeout', async () => {
                const path = get_path();

                fake.add( path, {
                    status_code: 200,
                    wait: 200,
                } );

                expect.assertions( 2 );
                try {
                    await do_request( {
                        path: path,
                        timeout: 100,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( de.ERROR_ID.REQUEST_TIMEOUT );
                }
            } );

        } );

        describe( 'content-encoding', () => {

            it( 'gzip', async () => {
                const path = get_path();

                const CONTENT = 'Привет!';

                fake.add( path, function( req, res ) {
                    const buffer = zlib_.gzipSync( Buffer.from( CONTENT ) );

                    res.setHeader( 'content-encoding', 'gzip' );
                    res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                    res.end( buffer );
                } );

                const result = await do_request( {
                    path: path,
                } );

                expect( result.body.toString() ).toBe( CONTENT );
            } );

            it( 'gzip with error', async () => {
                const path = get_path();

                const CONTENT = 'Привет!';

                fake.add( path, function( req, res ) {
                    //  Шлем контент, не являющийся gzip'ом.
                    const buffer = Buffer.from( CONTENT );

                    res.setHeader( 'content-encoding', 'gzip' );
                    res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                    res.end( buffer );
                } );

                expect.assertions( 3 );
                try {
                    await do_request( {
                        path: path,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( 'UNKNOWN_ERROR' );
                    expect( error.error.code ).toBe( 'Z_DATA_ERROR' );
                }
            } );

        } );

    } );

    describe( 'https', () => {

        const PORT = 9002;

        const do_request = get_do_request( {
            protocol: 'https:',
            host: '127.0.0.1',
            port: PORT,
            path: '/',
        } );

        let server_key;
        let server_cert;
        try {
            server_key = fs_.readFileSync( path_.join( __dirname, 'server.key' ) );
            server_cert = fs_.readFileSync( path_.join( __dirname, 'server.crt' ) );

        } catch ( e ) {
            throw Error(
                'Generate https keys:\n' +
                '    cd tests\n' +
                '    ./gen-certs.sh\n'
            );
        }

        const fake = new Server( {
            module: https_,
            port: PORT,
            options: {
                key: server_key,
                cert: server_cert,
            },
        } );

        beforeAll( () => fake.start() );
        afterAll( () => fake.stop() );

        it( 'GET', async () => {
            const path = get_path();

            const CONTENT = 'Привет!';

            fake.add( path, {
                status_code: 200,
                content: CONTENT,
            } );

            const result = await do_request( {
                path: path,
            } );

            expect( Buffer.isBuffer( result.body ) ).toBe( true );
            expect( result.body.toString() ).toBe( CONTENT );
        } );

    } );

    describe( 'default options', () => {

        describe( 'is_error', () => {

            const is_error = request.DEFAULT_OPTIONS.is_error;

            it.each( [ de.ERROR_ID.TCP_CONNECTION_TIMEOUT, de.ERROR_ID.REQUEST_TIMEOUT ] )( 'error_id=%j', ( error_id ) => {
                const error = de.error( {
                    id: error_id,
                } );

                expect( is_error( error ) ).toBe( true );
            } );

            it.each( [ 200, 301, 302, 303, 304 ] )( 'status_code=%j', ( status_code ) => {
                const error = de.error( {
                    status_code: status_code,
                } );

                expect( is_error( error ) ).toBe( false );
            } );

            it.each( [ 400, 401, 402, 403, 404, 500, 501, 503 ] )( 'status_code=%j', ( status_code ) => {
                const error = de.error( {
                    status_code: status_code,
                } );

                expect( is_error( error ) ).toBe( true );
            } );

        } );

    } );

} );

