const http_ = require( 'http' );
const url_ = require( 'url' );
const qs_ = require( 'querystring' );

const de = require( '../lib' );

const Server = require( './server' );

const { get_path, get_result_block } = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'http', () => {

    const PORT = 10000;

    const base_block = de.http( {
        block: {
            protocol: 'http:',
            hostname: '127.0.0.1',
            port: PORT,
        },
        options: {
            logger: new de.Logger(),
        },
    } );

    const fake = new Server( {
        module: http_,
        port: PORT,
    } );

    beforeAll( () => fake.start() );
    afterAll( () => fake.stop() );

    describe( 'basic block properties', () => {
        const path = get_path();

        const PROPS = [
            [ 'method', 'POST' ],
            [ 'protocol', 'http:' ],
            [ 'port', PORT ],
            [ 'hostname', '127.0.0.1' ],
            [ 'pathname', path ],
            [ 'max_retries', 0 ],
            [ 'timeout', 100 ],
            [ 'headers', {} ],
            [ 'query', {} ],
            [ 'body', {} ],
        ];

        fake.add( path );

        it.each( PROPS )( '%j is a function and it gets { params, context }', async ( name, value ) => {
            const spy = jest.fn( () => value );

            const block = base_block( {
                block: {
                    pathname: path,
                    //  Чтобы body отработал.
                    method: 'POST',
                    [ name ]: spy,
                },
            } );

            const params = {
                foo: 42,
            };
            const context = {
                req: true,
                res: true,
            };
            await de.run( block, { params, context } );

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect( call.params ).toBe( params );
            expect( call.context ).toBe( context );
        } );

        it.each( PROPS )( '%j is a function and it gets { deps }', async ( name, value ) => {
            const spy = jest.fn( () => value );

            let foo_result;
            let id;
            const block = de.func( {
                block: ( { generate_id } ) => {
                    id = generate_id();

                    return de.object( {
                        block: {
                            foo: get_result_block( () => {
                                foo_result = {
                                    foo: 42,
                                };
                                return foo_result;
                            } )( {
                                options: {
                                    id: id,
                                },
                            } ),

                            bar: base_block( {
                                block: {
                                    pathname: path,
                                    method: 'POST',
                                    [ name ]: spy,
                                },

                                options: {
                                    deps: id,
                                },
                            } ),
                        },
                    } );
                },
            } );

            await de.run( block );

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect( call.deps[ id ] ).toBe( foo_result );
        } );

    } );

    /*
    it( 'path is a string', async () => {
        const path = get_path();

        const CONTENT = 'Привет!';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        const block = base_block( {
            block: {
                pathname: path,
            },
        } );

        const result = await de.run( block );

        expect( result.status_code ).toBe( 200 );
        expect( result.result ).toBe( CONTENT );
    } );

    it( 'path is a function', async () => {
        const path = get_path();

        const CONTENT = 'Привет!';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        const block = base_block( {
            block: {
                pathname: () => path,
            },
        } );

        const result = await de.run( block );

        expect( result.status_code ).toBe( 200 );
        expect( result.result ).toBe( CONTENT );
    } );
    */

    describe( 'headers', () => {

        it( 'is a function', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            let block_headers;
            const block = base_block( {
                block: {
                    pathname: path,
                    headers: () => {
                        block_headers = {
                            'x-a': 'a',
                            'X-B': 'B',
                        };
                        return block_headers;
                    },
                },
            } );

            await de.run( block );

            const headers = spy.mock.calls[ 0 ][ 0 ].headers;
            expect( headers[ 'x-a' ] ).toBe( 'a' );
            expect( headers[ 'x-b' ] ).toBe( 'B' );
        } );

        it( 'is an object', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const header_spy = jest.fn( () => 'c' );
            const block = base_block( {
                block: {
                    pathname: path,
                    headers: {
                        'x-a': 'a',
                        'X-B': 'B',
                        'x-c': header_spy,
                    },
                },
            } );

            await de.run( block );

            const headers = spy.mock.calls[ 0 ][ 0 ].headers;
            expect( headers[ 'x-a' ] ).toBe( 'a' );
            expect( headers[ 'x-b' ] ).toBe( 'B' );
            expect( headers[ 'x-c' ] ).toBe( 'c' );
        } );

        it( 'is an object and value function gets { params, context }', async () => {
            const path = get_path();

            fake.add( path );

            const spy = jest.fn( () => 'a' );
            const block = base_block( {
                block: {
                    pathname: path,
                    headers: {
                        'x-a': spy,
                    },
                },
            } );

            const params = {
                foo: 42,
            };
            const context = {
                context: true,
            };
            await de.run( block, { params, context } );

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect( call.params ).toBe( params );
            expect( call.context ).toBe( context );
        } );

        describe( 'inheritance', () => {

            it( 'child block is undefined', async () => {
                const path = get_path();

                const RESPONSE = 'Привет!';
                fake.add( path, ( req, res ) => res.end( RESPONSE ) );

                const parent = base_block( {
                    block: {
                        pathname: path,
                    },
                } );
                const child = parent();

                const result = await de.run( child );

                expect( result.result ).toBe( RESPONSE );
            } );

            it( 'child is a function and it gets { headers }', async () => {
                const path = get_path();

                fake.add( path );

                const spy = jest.fn();

                let parent_headers;
                const parent = base_block( {
                    block: {
                        pathname: path,
                        headers: () => {
                            parent_headers = {
                                'x-a': 'a',
                            };
                            return parent_headers;
                        },
                    },
                } );
                const child = parent( {
                    block: {
                        headers: spy,
                    },
                } );

                await de.run( child );

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect( call.headers ).toBe( parent_headers );
            } );

            it( 'child is an object', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );
                fake.add( path, spy );

                const header_spy = jest.fn( () => 'b' );

                let parent_headers;
                const parent = base_block( {
                    block: {
                        pathname: path,
                        headers: () => {
                            parent_headers = {
                                'x-a': 'a',
                            };
                            return parent_headers;
                        },
                    },
                } );
                const child = parent( {
                    block: {
                        headers: {
                            'x-b': header_spy,
                            'X-C': 'C',
                        },
                    },
                } );

                await de.run( child );

                const header_call = header_spy.mock.calls[ 0 ][ 0 ];
                expect( header_call.headers ).toBe( parent_headers );

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect( call.headers[ 'x-a' ] ).toBe( undefined );
                expect( call.headers[ 'x-b' ] ).toBe( 'b' );
                expect( call.headers[ 'x-c' ] ).toBe( 'C' );
            } );

        } );

    } );

    describe( 'query', () => {

        it( 'is a function', async () => {
            const path = get_path();
            const spy = jest.fn( ( req, res ) => res.end() );
            fake.add( path, spy );

            const query = {
                b: 'b',
                a: 'a',
            };
            const block = base_block( {
                block: {
                    pathname: path,
                    query: () => query,
                },
            } );

            await de.run( block );

            const req = spy.mock.calls[ 0 ][ 0 ];
            expect( url_.parse( req.url, true ).query ).toEqual( query );
        } );

        it( 'is an object and value is null', async () => {
            const path = get_path();
            const spy = jest.fn( ( req, res ) => res.end() );
            fake.add( path, spy );

            const block = base_block( {
                block: {
                    pathname: path,
                    query: {
                        a: null,
                        b: null,
                        c: null,
                        d: null,
                        e: null,
                        f: null,
                    },
                },
            } );

            const params = {
                a: null,
                b: undefined,
                c: 0,
                d: '',
                e: false,
                f: 'foo',
                g: 'bar',
            };
            await de.run( block, { params } );

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse( req.url, true ).query;
            //  NOTE: В ноде query сделано через Object.create( null ),
            //  так что toStrictEqual работает неправильно с ним.
            expect( { ...query } ).toStrictEqual( {
                a: '',
                c: '0',
                d: '',
                e: 'false',
                f: 'foo',
            } );
        } );

        it( 'is an object and value is undefined', async () => {
            const path = get_path();
            const spy = jest.fn( ( req, res ) => res.end() );
            fake.add( path, spy );

            const block = base_block( {
                block: {
                    pathname: path,
                    query: {
                        a: undefined,
                        b: undefined,
                        c: undefined,
                        d: undefined,
                        e: undefined,
                        f: undefined,
                    },
                },
            } );

            const params = {
                a: null,
                b: undefined,
                c: 0,
                d: '',
                e: false,
                f: 'foo',
                g: 'bar',
            };
            await de.run( block, { params } );

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse( req.url, true ).query;
            expect( { ...query } ).toStrictEqual( {} );
        } );

        it( 'is an object and value is not null or undefined #1', async () => {
            const path = get_path();
            const spy = jest.fn( ( req, res ) => res.end() );
            fake.add( path, spy );

            const block = base_block( {
                block: {
                    pathname: path,
                    query: {
                        a: 0,
                        b: '',
                        c: false,
                        d: 42,
                        e: 'foo',
                    },
                },
            } );

            const params = {};
            await de.run( block, { params } );

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse( req.url, true ).query;
            expect( { ...query } ).toStrictEqual( {
                a: '0',
                b: '',
                c: 'false',
                d: '42',
                e: 'foo',
            } );
        } );

        it( 'is an object and value is not null or undefined #2', async () => {
            const path = get_path();
            const spy = jest.fn( ( req, res ) => res.end() );
            fake.add( path, spy );

            const block = base_block( {
                block: {
                    pathname: path,
                    query: {
                        a: 'foo',
                        b: 'foo',
                        c: 'foo',
                        d: 'foo',
                        e: 'foo',
                    },
                },
            } );

            const params = {
                a: 0,
                b: '',
                c: false,
                d: null,
                e: undefined,
            };
            await de.run( block, { params } );

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse( req.url, true ).query;
            expect( { ...query } ).toStrictEqual( {
                a: '0',
                b: '',
                c: 'false',
                d: '',
                e: 'foo',
            } );
        } );

        it( 'is an object and value function gets { params, context }', async () => {
            const path = get_path();
            fake.add( path );

            const spy = jest.fn();
            const block = base_block( {
                block: {
                    pathname: path,
                    query: spy,
                },
            } );

            const params = {
                foo: 42,
            };
            const context = {
                req: true,
                res: true,
            };
            await de.run( block, { params, context } );

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect( call.params ).toBe( params );
            expect( call.context ).toBe( context );
        } );

        it( 'is an array of object and function', async () => {
            const path = get_path();
            const spy = jest.fn( ( req, res ) => res.end() );
            fake.add( path, spy );

            const block = base_block( {
                block: {
                    pathname: path,
                    query: [
                        {
                            foo: null,
                        },
                        ( { query, params } ) => {
                            return {
                                ...query,
                                bar: params.bar,
                            };
                        },
                    ],
                },
            } );

            const params = {
                foo: 'foo',
                bar: 'bar',
                quu: 'quu',
            };
            await de.run( block, { params } );

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse( req.url, true ).query;
            expect( { ...query } ).toStrictEqual( {
                foo: 'foo',
                bar: 'bar',
            } );
        } );

        describe( 'inheritance', () => {

            it( 'child is a function and it gets { query }', async () => {
                const path = get_path();
                fake.add( path );

                let parent_query;
                const parent = base_block( {
                    block: {
                        pathname: path,
                        query: () => {
                            parent_query = {
                                foo: 42,
                            };
                            return parent_query;
                        },
                    },
                } );

                const spy = jest.fn();
                const child = parent( {
                    block: {
                        query: spy,
                    },
                } );

                await de.run( child );

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect( call.query ).toBe( parent_query );
            } );

            it( 'child is an object and value function gets { query }', async () => {
                const path = get_path();
                fake.add( path );

                let parent_query;
                const parent = base_block( {
                    block: {
                        pathname: path,
                        query: () => {
                            parent_query = {
                                foo: 42,
                            };
                            return parent_query;
                        },
                    },
                } );

                const spy = jest.fn();
                const child = parent( {
                    block: {
                        query: {
                            bar: spy,
                        },
                    },
                } );

                await de.run( child );

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect( call.query ).toBe( parent_query );
            } );

        } );

    } );

    describe( 'body', () => {

        it( 'no body', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body ).toBe( null );
        } );

        it( 'is a string', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = 'Привет!';
            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                    body: BODY,
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY );
        } );

        it( 'is a number', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = 42;
            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                    body: BODY,
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( String( BODY ) );
        } );

        it( 'is a Buffer', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = Buffer.from( 'Привет!' );
            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                    body: BODY,
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY.toString() );
        } );

        it( 'is a function returning string', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = 'Привет!';
            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                    body: () => BODY,
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY );
        } );

        it( 'is a function returning Buffer', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = Buffer.from( 'Привет!' );
            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                    body: () => BODY,
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY.toString() );
        } );

        it( 'is an function returning object', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = {
                a: 'Привет!',
            };
            const block = base_block( {
                block: {
                    pathname: path,
                    method: 'POST',
                    body: () => BODY,
                },
            } );

            await de.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( qs_.stringify( BODY ) );
        } );

    } );

    describe( 'parse response', () => {

        it( 'text/plain', async () => {
            const path = get_path();

            const RESPONSE = Buffer.from( 'Привет!' );
            fake.add( path, ( req, res ) => {
                res.setHeader( 'content-length', Buffer.byteLength( RESPONSE ) );
                res.setHeader( 'content-type', 'text/plain' );
                res.end( RESPONSE );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            const result = await de.run( block );

            expect( result.result.toString() ).toBe( RESPONSE.toString() );
        } );

        it( 'application/json #1', async () => {
            const path = get_path();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add( path, ( req, res ) => {
                const buffer = Buffer.from( JSON.stringify( RESPONSE ) );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'application/json' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            const result = await de.run( block );

            expect( result.result ).toEqual( RESPONSE );
        } );

        it( 'application/json #2', async () => {
            const path = get_path();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add( path, ( req, res ) => {
                const buffer = Buffer.from( JSON.stringify( RESPONSE ) );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'application/json; charset=utf-8' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            const result = await de.run( block );

            expect( result.result ).toEqual( RESPONSE );
        } );

        it( 'text/plain, is_json: true', async () => {
            const path = get_path();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add( path, ( req, res ) => {
                const buffer = Buffer.from( JSON.stringify( RESPONSE ) );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'text/plain' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                    is_json: true,
                },
            } );

            const result = await de.run( block );

            expect( result.result ).toEqual( RESPONSE );
        } );

        it( 'invalid json in response, application/json', async () => {
            const path = get_path();

            const RESPONSE = Buffer.from( 'Привет!' );
            fake.add( path, ( req, res ) => {
                res.setHeader( 'content-length', Buffer.byteLength( RESPONSE ) );
                res.setHeader( 'content-type', 'application/json' );
                res.end( RESPONSE );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            expect.assertions( 2 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( de.is_error( error ) ).toBe( true );
                expect( error.error.id ).toEqual( de.ERROR_ID.INVALID_JSON );
            }
        } );

        it( 'invalid json in response, is_json: true', async () => {
            const path = get_path();

            const RESPONSE = Buffer.from( 'Привет!' );
            fake.add( path, ( req, res ) => {
                res.setHeader( 'content-length', Buffer.byteLength( RESPONSE ) );
                res.setHeader( 'content-type', 'text/plain' );
                res.end( RESPONSE );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                    is_json: true,
                },
            } );

            expect.assertions( 2 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( de.is_error( error ) ).toBe( true );
                expect( error.error.id ).toEqual( de.ERROR_ID.INVALID_JSON );
            }
        } );

    } );

    describe( 'parse error', () => {

        it( 'no body', async () => {
            const path = get_path();

            fake.add( path, ( req, res ) => {
                res.statusCode = 503;
                res.end();
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            expect.assertions( 1 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( error.error.body ).toBe( null );
            }
        } );

        it( 'text/plain', async () => {
            const path = get_path();

            const RESPONSE = 'Привет!';
            fake.add( path, ( req, res ) => {
                res.statusCode = 503;
                const buffer = Buffer.from( RESPONSE );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'text/plain' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            expect.assertions( 1 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( error.error.body ).toBe( RESPONSE );
            }
        } );

        it( 'application/json', async () => {
            const path = get_path();

            const RESPONSE = {
                error: 'Ошибка!',
            };
            fake.add( path, ( req, res ) => {
                res.statusCode = 503;
                const buffer = Buffer.from( JSON.stringify( RESPONSE ) );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'application/json' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            expect.assertions( 1 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( error.error.body ).toEqual( RESPONSE );
            }
        } );

        it( 'text/plain, is_json: true, invalid json in repsonse', async () => {
            const path = get_path();

            const RESPONSE = 'Привет!';
            fake.add( path, ( req, res ) => {
                res.statusCode = 503;
                const buffer = Buffer.from( RESPONSE );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'text/plain' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                    is_json: true,
                },
            } );

            expect.assertions( 1 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( error.error.body ).toBe( RESPONSE );
            }
        } );

        it( 'application/json, invalid json in repsonse', async () => {
            const path = get_path();

            const RESPONSE = 'Привет!';
            fake.add( path, ( req, res ) => {
                res.statusCode = 503;
                const buffer = Buffer.from( RESPONSE );
                res.setHeader( 'content-length', Buffer.byteLength( buffer ) );
                res.setHeader( 'content-type', 'application/json' );
                res.end( buffer );
            } );

            const block = base_block( {
                block: {
                    pathname: path,
                },
            } );

            expect.assertions( 1 );
            try {
                await de.run( block );

            } catch ( error ) {
                expect( error.error.body ).toBe( RESPONSE );
            }
        } );

    } );

    describe( 'misc', () => {

        it( 'extra', async () => {
            const path = get_path();

            fake.add( path, {
                status_code: 200,
            } );

            const NAME = 'resource_name';
            const block = base_block( {
                block: {
                    pathname: path,
                },

                options: {
                    name: NAME,
                },
            } );

            const result = await de.run( block );

            expect( result.request_options.extra ).toEqual( {
                name: NAME,
            } );
        } );

        it( 'prepare_request_options', async () => {
            const path_1 = get_path();
            const path_2 = get_path();

            const spy_1 = jest.fn( ( req, res ) => res.end() );
            const spy_2 = jest.fn( ( req, res ) => res.end() );
            fake.add( path_1, spy_1 );
            fake.add( path_2, spy_2 );

            const block = base_block( {
                block: {
                    pathname: path_1,
                    prepare_request_options: ( request_options ) => {
                        return {
                            ...request_options,
                            pathname: path_2,
                        };
                    },
                },
            } );

            await de.run( block );

            expect( spy_1.mock.calls.length ).toBe( 0 );
            expect( spy_2.mock.calls.length ).toBe( 1 );
        } );

    } );

} );

