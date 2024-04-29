const url_ = require( 'url' );
const qs_ = require( 'querystring' );
const path_ = require( 'path' );
const fs_ = require( 'fs' );
const http_ = require( 'http' );
const https_ = require( 'https' );
const { gzipSync, gunzipSync } = require( 'node:zlib' );
const { compress } = require( '@fengkx/zstd-napi' );
const { Duplex } = require( 'stream' );

const de = require( '../lib' );
const request = require( '../lib/request' );
const Server = require( './server' );

const { get_path, wait_for_value } = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

function get_do_request( default_options ) {
    return function do_request( options, logger, cancel ) {
        logger = logger || new de.Logger( { debug: true } );
        cancel = cancel || new de.Cancel();
        const context = null;

        return request( { ...default_options, ...options }, logger, context, cancel );
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'request', () => {

    describe( 'http', () => {

        const PORT = 9000;
        const PORT_IPV6 = 9006;

        const do_request = get_do_request( {
            protocol: 'http:',
            hostname: '127.0.0.1',
            port: PORT,
            pathname: '/',
        } );

        const fake = new Server( {
            module: http_,
            listen_options: {
                port: PORT,
            },
        } );

        const fake_ipv6 = new Server( {
            module: http_,
            listen_options: {
                host: '::1',
                port: PORT_IPV6,
                ipv6Only: true,
            },
        } );

        beforeAll( () => Promise.all( [
            fake.start(),
            fake_ipv6.start(),
        ] ) );
        afterAll( () => Promise.all( [
            fake.stop(),
            fake_ipv6.stop(),
        ] ) );

        it.each( [ 'GET', 'DELETE' ] )( '%j', async ( method ) => {
            const path = get_path();

            const CONTENT = 'Привет!';

            fake.add( path, {
                status_code: 200,
                content: CONTENT,
            } );

            const result = await do_request( {
                method: method,
                pathname: path,
            } );

            expect( result.status_code ).toBe( 200 );
            expect( Buffer.isBuffer( result.body ) ).toBe( true );
            expect( result.body.toString() ).toBe( CONTENT );
        } );

        it( 'pathname always starts with /', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                pathname: path.replace( /^\//, '' ),
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            expect( url_.parse( req.url ).pathname ).toBe( path );
        } );

        it( 'sets accept-encoding to gzip,deflate', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                pathname: path,
            } );

            const [ req ] = spy.mock.calls[ 0 ];

            expect( req.headers[ 'accept-encoding' ] ).toBe( 'gzip,deflate' );
        } );

        it( 'adds gzip,deflate to accept-encoding', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                pathname: path,
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
                pathname: path,
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
                pathname: path,
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
                pathname: path,
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
                    pathname: path,
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
                pathname: path,
                body: BODY,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'application/octet-stream' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( BODY.length );
            expect( Buffer.compare( BODY, body ) ).toBe( 0 );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH', 'DELETE' ] )( '%j, body is a string', async ( method ) => {
            const path = get_path();

            const BODY = 'Привет!';

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                pathname: path,
                body: BODY,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'text/plain' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( Buffer.byteLength( BODY ) );
            expect( body.toString() ).toBe( BODY );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH', 'DELETE' ] )( '%j, body is a string, custom content-type', async ( method ) => {
            const path = get_path();

            const BODY = 'div { color: red; }';

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                pathname: path,
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

        it.each( [ 'POST', 'PUT', 'PATCH', 'DELETE' ] )( '%j, body is an object', async ( method ) => {
            const path = get_path();

            const BODY = {
                id: 42,
                text: 'Привет!',
            };

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                pathname: path,
                body: BODY,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];
            const body_string = qs_.stringify( BODY );

            expect( req.method ).toBe( method );
            expect( req.headers[ 'content-type' ] ).toBe( 'application/x-www-form-urlencoded' );
            expect( Number( req.headers[ 'content-length' ] ) ).toBe( Buffer.byteLength( body_string ) );
            expect( body.toString() ).toBe( body_string );
        } );

        it.each( [ 'POST', 'PUT', 'PATCH', 'DELETE' ] )( '%j, body is an object, content-type is application/json', async ( method ) => {
            const path = get_path();

            const BODY = {
                id: 42,
                text: 'Привет!',
            };

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                pathname: path,
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

        it.each( [ 'POST' ] )( '%j, body_compress', async ( method ) => {
            const path = get_path();

            const BODY = 'Привет!'.repeat( 1000 );

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                pathname: path,
                body: BODY,
                body_compress: true,
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers ).toHaveProperty( 'content-type', 'text/plain' );
            expect( req.headers ).toHaveProperty( 'content-encoding', 'gzip' );
            expect( req.headers ).toHaveProperty( 'transfer-encoding', 'chunked' );
            expect( req.headers ).not.toHaveProperty( 'content-length' );

            //  http://www.zlib.org/rfc-gzip.html#header-trailer
            //  2.3.1. Member header and trailer
            //  These have the fixed values ID1 = 31 (0x1f), ID2 = 139 (0x8b), to identify the file as being in gzip format.
            expect( body.slice( 0, 2 ).equals( Buffer.from( '1f8b', 'hex' ) ) ).toBe( true );
            expect( body ).toHaveLength( 77 );
            expect( gunzipSync( body ).toString( 'utf-8' ) ).toBe( BODY );
        } );

        it.each( [ 'POST' ] )( '%j, body_compress with options', async ( method ) => {
            const path = get_path();

            const BODY = 'Привет!'.repeat( 1000 );

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            await do_request( {
                method: method,
                pathname: path,
                body: BODY,
                body_compress: {
                    level: 1,
                },
            } );

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect( req.method ).toBe( method );
            expect( req.headers ).toHaveProperty( 'content-type', 'text/plain' );
            expect( req.headers ).toHaveProperty( 'content-encoding', 'gzip' );
            expect( req.headers ).toHaveProperty( 'transfer-encoding', 'chunked' );
            expect( req.headers ).not.toHaveProperty( 'content-length' );

            //  http://www.zlib.org/rfc-gzip.html#header-trailer
            //  2.3.1. Member header and trailer
            //  These have the fixed values ID1 = 31 (0x1f), ID2 = 139 (0x8b), to identify the file as being in gzip format.
            expect( body.slice( 0, 2 ).equals( Buffer.from( '1f8b', 'hex' ) ) ).toBe( true );
            expect( body ).toHaveLength( 134 );
            expect( gunzipSync( body ).toString( 'utf-8' ) ).toBe( BODY );
        } );

        describe( 'errors', () => {

            it( '2xx, custom is_error', async () => {
                const path = get_path();
                const status_code = 200;

                fake.add( path, {
                    status_code: status_code,
                } );

                expect.assertions( 2 );
                try {
                    await do_request( {
                        pathname: path,
                        is_error: () => true,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.status_code ).toBe( status_code );
                }
            } );

            it( '4xx, max_retries=1', async () => {
                const path = get_path();
                const status_code = 404;

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
                        pathname: path,
                        max_retries: 1,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.status_code ).toBe( status_code );
                    expect( spy.mock.calls ).toHaveLength( 0 );
                }
            } );

            it( '4xx, max_retries=1, custom is_retry_allowed', async () => {
                const path = get_path();
                const status_code = 404;
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
                    pathname: path,
                    max_retries: 1,
                    is_retry_allowed: () => true,
                } );

                expect( result.status_code ).toBe( 200 );
                expect( result.body.toString() ).toBe( CONTENT );
            } );

            it( '5xx, max_retries=0', async () => {
                const path = get_path();
                const status_code = 503;

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
                        pathname: path,
                        max_retries: 0,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.status_code ).toBe( status_code );
                    expect( spy.mock.calls ).toHaveLength( 0 );
                }
            } );

            it( '5xx, max_retries=1, custom is_retry_allowed', async () => {
                const path = get_path();
                const status_code = 503;

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
                        pathname: path,
                        max_retries: 1,
                        is_retry_allowed: () => false,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.status_code ).toBe( status_code );
                    expect( spy.mock.calls ).toHaveLength( 0 );
                }
            } );

            it( '5xx, max_retries=1', async () => {
                const path = get_path();
                const status_code = 503;
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
                    pathname: path,
                    max_retries: 1,
                } );

                expect( result.status_code ).toBe( 200 );
                expect( result.body.toString() ).toBe( CONTENT );
            } );

            it( '5xx, max_retries=1, retry_timeout=0', async () => {
                const path = get_path();
                const status_code = 503;
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
                    pathname: path,
                    max_retries: 1,
                    retry_timeout: 0,
                } );

                expect( result.status_code ).toBe( 200 );
                expect( result.body.toString() ).toBe( CONTENT );
            } );

            it( '5xx, max_retries=1, retry_timeout=100', async () => {
                const path = get_path();

                let end;

                fake.add( path, [
                    {
                        status_code: 503,
                    },
                    ( req, res ) => {
                        end = Date.now();

                        res.statusCode = 200;
                        res.end();
                    },
                ] );

                const RETRY_TIMEOUT = 100;

                const start = Date.now();
                await do_request( {
                    pathname: path,
                    max_retries: 1,
                    retry_timeout: RETRY_TIMEOUT,
                } );

                expect( end - start > RETRY_TIMEOUT ).toBe( true );
            } );

            it.each( [ 'POST', 'PATCH' ] )( '5xx, %j, max_retries=1, no retry', async ( method ) => {
                const path = get_path();
                const status_code = 503;

                const spy = jest.fn( ( res ) => res.end() );

                fake.add( path, [
                    {
                        status_code: status_code,
                    },
                    spy,
                ] );

                expect.assertions( 2 );
                try {
                    await do_request( {
                        pathname: path,
                        method: method,
                        max_retries: 1,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.status_code ).toBe( status_code );
                }
            } );

            it( 'timeout', async () => {
                const path = get_path();

                fake.add( path, {
                    status_code: 200,
                    //  Тут wait работает так: сперва 100 мс таймаут, а потом уже ответ.
                    //  Следующий пример про наборот, когда сразу statusCode = 200 и res.write(),
                    //  а через таймаут только res.end().
                    //
                    wait: 100,
                } );

                expect.assertions( 2 );
                try {
                    await do_request( {
                        pathname: path,
                        timeout: 50,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( de.ERROR_ID.REQUEST_TIMEOUT );
                }
            } );

            it( '200, timeout, incomplete response', async () => {
                const path = get_path();

                fake.add( path, async ( req, res ) => {
                    res.statusCode = 200;
                    res.write( 'Привет!' );
                    await wait_for_value( null, 100 );
                    res.end();
                } );

                expect.assertions( 2 );
                try {
                    await do_request( {
                        pathname: path,
                        timeout: 50,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( de.ERROR_ID.REQUEST_TIMEOUT );
                }
            } );

        } );

        describe( 'content-encoding', () => {

            describe( 'zlib', () => {
                it( 'decompress', async () => {
                    const path = get_path();

                    const CONTENT = 'Привет!';

                    fake.add( path, function( req, res ) {
                        const buffer = gzipSync( Buffer.from( CONTENT ) );

                        res.setHeader( 'content-encoding', 'gzip' );
                        res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                        res.end( buffer );
                    } );

                    const result = await do_request( {
                        pathname: path,
                    } );

                    expect( result.body.toString() ).toBe( CONTENT );
                } );

                it( 'decompress with error', async () => {
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
                            pathname: path,
                        } );

                    } catch ( error ) {
                        expect( de.is_error( error ) ).toBe( true );
                        expect( error.error.id ).toBe( 'UNKNOWN_ERROR' );
                        expect( error.error.code ).toBe( 'Z_DATA_ERROR' );
                    }
                } );
            } );

            describe( 'zstd', () => {
                it( 'decompress', async () => {
                    const path = get_path();

                    const CONTENT = 'Привет!';
                    const buffer = Buffer.from( CONTENT );
                    const stream = new Duplex();
                    stream.push( await compress( buffer ) );
                    stream.push( null );

                    fake.add( path, function( req, res ) {
                        res.setHeader( 'content-encoding', 'zstd' );

                        stream.pipe( res );
                    } );

                    const result = await do_request( {
                        pathname: path,
                    } );

                    expect( result.body.toString() ).toBe( CONTENT );
                } );

                it( 'decompress with error', async () => {
                    const path = get_path();

                    const CONTENT = 'Привет!';

                    fake.add( path, function( req, res ) {
                        const buffer = Buffer.from( CONTENT );

                        res.setHeader( 'content-encoding', 'zstd' );
                        res.end( buffer );
                    } );

                    expect.assertions( 3 );
                    try {
                        await do_request( {
                            pathname: path,
                        } );

                    } catch ( error ) {
                        expect( de.is_error( error ) ).toBe( true );
                        expect( error.error.id ).toBe( 'UNKNOWN_ERROR' );
                        expect( error.error.code ).toBe( 'GenericFailure' );
                    }
                } );
            } );

        } );

        describe( 'agent', () => {

            it( 'is an object', async () => {
                const path = get_path();

                fake.add( path, {
                    status_code: 200,
                } );

                const agent = {
                    keepAlive: true,
                };

                await do_request( {
                    pathname: path,
                    agent: agent,
                } );
                const result2 = await do_request( {
                    pathname: path,
                    agent: agent,
                } );

                expect( result2.timestamps.socket === result2.timestamps.tcp_connection ).toBe( true );
            } );

            it( 'is an http.Agent instance', async () => {
                const path = get_path();

                fake.add( path, {
                    status_code: 200,
                } );

                const agent = new http_.Agent( {
                    keepAlive: true,
                } );

                await do_request( {
                    pathname: path,
                    agent: agent,
                } );
                const result2 = await do_request( {
                    pathname: path,
                    agent: agent,
                } );

                expect( result2.timestamps.socket === result2.timestamps.tcp_connection ).toBe( true );
            } );

        } );

        describe( 'family', () => {

            it( 'family: 6', async () => {
                const path = get_path();

                const CONTENT = 'Привет!';

                fake_ipv6.add( path, {
                    status_code: 200,
                    content: CONTENT,
                } );

                const result = await do_request( {
                    family: 6,
                    hostname: 'localhost',
                    method: 'GET',
                    pathname: path,
                    port: PORT_IPV6,
                } );

                expect( result.status_code ).toBe( 200 );
                expect( Buffer.isBuffer( result.body ) ).toBe( true );
                expect( result.body.toString() ).toBe( CONTENT );
            } );

        } );

        describe( 'cancel', () => {

            it( 'cancel before request ended', async () => {
                const path = get_path();

                fake.add( path, {
                    status_code: 200,
                    wait: 200,
                } );

                const error = de.error( {
                    id: 'SOME_ERROR',
                } );
                const cancel = new de.Cancel();
                setTimeout( () => {
                    cancel.cancel( error );
                }, 50 );

                expect.assertions( 3 );
                try {
                    await do_request( {
                        pathname: path,
                    }, undefined, cancel );

                } catch ( e ) {
                    expect( de.is_error( e ) ).toBe( true );
                    expect( e.error.id ).toBe( de.ERROR_ID.HTTP_REQUEST_ABORTED );
                    expect( e.error.reason ).toBe( error );
                }
            } );

            it( 'cancel after request ended', async () => {
                const path = get_path();

                const CONTENT = 'Привет!';
                fake.add( path, {
                    status_code: 200,
                    content: CONTENT,
                    wait: 50,
                } );

                const error = de.error( {
                    id: 'SOME_ERROR',
                } );
                const cancel = new de.Cancel();
                setTimeout( () => {
                    cancel.cancel( error );
                }, 100 );

                const result = await do_request( {
                    pathname: path,
                }, undefined, cancel );

                expect( result.body.toString() ).toBe( CONTENT );
            } );

        } );

    } );

    describe( 'https', () => {

        const PORT = 9001;

        const do_request = get_do_request( {
            protocol: 'https:',
            hostname: '127.0.0.1',
            port: PORT,
            pathname: '/',
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
                '    ./gen-certs.sh\n',
            );
        }

        const fake = new Server( {
            module: https_,
            listen_options: {
                port: PORT,
            },
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
                rejectUnauthorized: false,
                pathname: path,
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

    describe( 'aborted request', () => {

        describe( 'no bytes sent', () => {
            const server = http_.createServer( ( req, res ) => {
                setTimeout( () => {
                    res.socket.destroy();
                }, 100 );
            } );
            const PORT = 9002;

            beforeAll( () => server_listen( server, PORT ) );
            afterAll( () => server_close( server ) );

            it( '', async () => {
                const do_request = get_do_request( {
                    protocol: 'http:',
                    hostname: '127.0.0.1',
                    port: PORT,
                    pathname: '/',
                } );

                const path = get_path();

                expect.assertions( 2 );
                try {
                    await do_request( {
                        pathname: path,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( de.ERROR_ID.HTTP_UNKNOWN_ERROR );
                }
            } );
        } );

        describe( 'some bytes sent', () => {
            const server = http_.createServer( ( req, res ) => {
                res.write( 'Hello!' );
                setTimeout( () => {
                    res.socket.destroy();
                }, 100 );
            } );
            const PORT = 9003;

            const do_request = get_do_request( {
                protocol: 'http:',
                hostname: '127.0.0.1',
                port: PORT,
            } );

            beforeAll( () => server_listen( server, PORT ) );
            afterAll( () => server_close( server ) );

            it( '', async () => {
                expect.assertions( 2 );
                try {
                    await do_request();

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( de.ERROR_ID.INCOMPLETE_RESPONSE );
                }
            } );

            it( 'cancelled', async () => {
                const cancel = new de.Cancel();
                const error = de.error( {
                    id: 'SOME_ERROR',
                } );
                setTimeout( () => {
                    cancel.cancel( error );
                }, 50 );

                expect.assertions( 3 );
                try {
                    await do_request( {}, undefined, cancel );

                } catch ( e ) {
                    expect( de.is_error( e ) ).toBe( true );
                    expect( e.error.id ).toBe( de.ERROR_ID.HTTP_REQUEST_ABORTED );
                    expect( e.error.reason ).toBe( error );
                }
            } );

        } );

        describe( 'tcp connection timeout', () => {
            const PORT = 9004;
            const server = http_.createServer( ( req, res ) => {
                setTimeout( () => res.end(), 100 );
            } );

            const do_request = get_do_request( {
                protocol: 'http:',
                hostname: '127.0.0.1',
                port: PORT,
            } );

            beforeAll( () => server_listen( server, PORT ) );
            afterAll( () => server_close( server ) );

            it( '', async () => {
                expect.assertions( 2 );
                try {
                    const agent = {
                        keepAlive: false,
                        maxSockets: 1,
                    };

                    //  Делаем запрос и занимаем весь один сокет.
                    do_request( {
                        agent: agent,
                    } );
                    //  Так что этот запрос не сможет законнектиться.
                    await do_request( {
                        agent: agent,
                        //  Тут должно быть что-то меньшее, чем время, за которое отвечает сервер.
                        timeout: 50,
                    } );

                } catch ( error ) {
                    expect( de.is_error( error ) ).toBe( true );
                    expect( error.error.id ).toBe( de.ERROR_ID.TCP_CONNECTION_TIMEOUT );
                }
            } );

        } );

    } );

} );

function server_listen( server, port ) {
    return new Promise( ( resolve ) => {
        server.listen( port, resolve );
    } );
}

function server_close( server ) {
    return new Promise( ( resolve ) => {
        server.close( resolve );
    } );
}
