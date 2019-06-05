const http_ = require( 'http' );
const url_ = require( 'url' );
const qs_ = require( 'querystring' );

const de = require( '../lib' );

const Server = require( './server' );

const { get_path } = require( './helpers' );

//  ---------------------------------------------------------------------------------------------------------------  //

const P_METHODS = [ 'POST', 'PUT', 'PATCH' ];

//  ---------------------------------------------------------------------------------------------------------------  //

describe( 'http', () => {

    const PORT = 10000;

    const base_block = de.http( {
        block: {
            protocol: 'http:',
            host: '127.0.0.1',
            port: PORT,
        },
    } );

    const fake = new Server( {
        module: http_,
        port: PORT,
    } );

    beforeAll( () => fake.start() );
    afterAll( () => fake.stop() );

    it( 'path is a string', async () => {
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

    it( 'path is a function', async () => {
        const path = get_path();

        const CONTENT = 'Привет!';

        fake.add( path, {
            status_code: 200,
            content: CONTENT,
        } );

        const block = base_block( {
            block: {
                path: () => path,
            },
        } );

        const context = new de.Context();
        const result = await context.run( block );

        expect( result.status_code ).toBe( 200 );
        expect( result.result ).toBe( CONTENT );
    } );

    describe( 'headers', () => {

        it( 'is an object', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const block = base_block( {
                block: {
                    path: path,
                    headers: {
                        'x-a': 'a',
                        'X-B': 'b',
                        'x-c': () => 'c',
                        'x-d': null,
                        'x-e': undefined,
                        'x-f': () => null,
                        'x-g': () => undefined,
                    },
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const headers = spy.mock.calls[ 0 ][ 0 ].headers;
            expect( headers[ 'x-a' ] ).toBe( 'a' );
            expect( headers[ 'x-b' ] ).toBe( 'b' );
            expect( headers[ 'x-c' ] ).toBe( 'c' );
            expect( headers[ 'x-d' ] ).toBe( undefined );
            expect( headers[ 'x-e' ] ).toBe( undefined );
            expect( headers[ 'x-f' ] ).toBe( undefined );
            expect( headers[ 'x-g' ] ).toBe( undefined );
        } );

        it( 'is a function', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const block = base_block( {
                block: {
                    path: path,
                    headers: () => {
                        return {
                            'x-a': 'a',
                            'X-B': 'b',
                            'x-c': null,
                            'x-d': undefined,
                        };
                    },
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const headers = spy.mock.calls[ 0 ][ 0 ].headers;
            expect( headers[ 'x-a' ] ).toBe( 'a' );
            expect( headers[ 'x-b' ] ).toBe( 'b' );
            expect( headers[ 'x-c' ] ).toBe( undefined );
            expect( headers[ 'x-d' ] ).toBe( undefined );
        } );

        describe( 'inheritance', () => {

            it( 'no headers and object', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: {
                            'x-a': 'a',
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
            } );

            it( 'no headers and function', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: () => {
                            return {
                                'x-a': 'a',
                            };
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
            } );

            it( 'object and no headers', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: {
                            'x-a': 'a',
                        },
                    },
                } );
                const block2 = block1();

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
            } );

            it( 'function and no headers', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: () => {
                            return {
                                'x-a': 'a',
                            };
                        },
                    },
                } );
                const block2 = block1();

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
            } );

            it( 'object and object', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: {
                            'x-a': 'a',
                            'x-b': 'b',
                        },
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: {
                            'x-b': 'B',
                            'x-c': 'C',
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
                expect( headers[ 'x-b' ] ).toBe( 'B' );
                expect( headers[ 'x-c' ] ).toBe( 'C' );
            } );

            it( 'object and function', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: {
                            'x-a': 'a',
                            'x-b': 'b',
                        },
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: () => {
                            return {
                                'x-b': 'B',
                                'x-c': 'C',
                            };
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
                expect( headers[ 'x-b' ] ).toBe( 'B' );
                expect( headers[ 'x-c' ] ).toBe( 'C' );
            } );

            it( 'function and object', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: () => {
                            return {
                                'x-a': 'a',
                                'x-b': 'b',
                            };
                        },
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: {
                            'x-b': 'B',
                            'x-c': 'C',
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
                expect( headers[ 'x-b' ] ).toBe( 'B' );
                expect( headers[ 'x-c' ] ).toBe( 'C' );
            } );

            it( 'function and function', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: () => {
                            return {
                                'x-a': 'a',
                                'x-b': 'b',
                            };
                        },
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: () => {
                            return {
                                'x-b': 'B',
                                'x-c': 'C',
                            };
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
                expect( headers[ 'x-b' ] ).toBe( 'B' );
                expect( headers[ 'x-c' ] ).toBe( 'C' );
            } );

            it( 'null value deletes header', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: {
                            'x-a': 'a',
                        },
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: {
                            'x-a': null,
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( undefined );
            } );

            it( 'undefined value is ignored', async () => {
                const path = get_path();

                const spy = jest.fn( ( req, res ) => res.end() );

                fake.add( path, spy );

                const block1 = base_block( {
                    block: {
                        path: path,
                        headers: {
                            'x-a': 'a',
                        },
                    },
                } );
                const block2 = block1( {
                    block: {
                        headers: {
                            'x-a': undefined,
                        },
                    },
                } );

                const context = new de.Context();
                await context.run( block2 );

                const headers = spy.mock.calls[ 0 ][ 0 ].headers;
                expect( headers[ 'x-a' ] ).toBe( 'a' );
            } );

        } );

    } );

    describe( 'query', () => {

        it( 'is an object', async () => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const query = {
                b: 'b',
                a: 'a',
            };
            const block = base_block( {
                block: {
                    path: path,
                    query: query,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const req = spy.mock.calls[ 0 ][ 0 ];
            expect( url_.parse( req.url, true ).query ).toEqual( query );
        } );

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
                    path: path,
                    query: () => query,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const req = spy.mock.calls[ 0 ][ 0 ];
            expect( url_.parse( req.url, true ).query ).toEqual( query );
        } );

    } );

    describe( 'body', () => {

        it.each( P_METHODS )( 'no body, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body ).toBe( null );
        } );

        it.each( P_METHODS )( 'is a number, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: 42,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( '42' );
        } );

        it.each( P_METHODS )( 'is a string, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = 'Привет!';
            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: BODY,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY );
        } );

        it.each( P_METHODS )( 'is a Buffer, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = Buffer.from( 'Привет!' );
            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: BODY,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY.toString() );
        } );

        it.each( P_METHODS )( 'is an object, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = {
                a: 'Привет!',
                b: () => 'Привет!',
                c: null,
                d: undefined,
            };
            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: BODY,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( qs_.stringify( {
                a: 'Привет!',
                b: 'Привет!',
            } ) );
        } );

        it.each( P_METHODS )( 'is a function returning string, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = 'Привет!';
            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: () => BODY,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY );
        } );

        it.each( P_METHODS )( 'is a function returning Buffer, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = Buffer.from( 'Привет!' );
            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: () => BODY,
                },
            } );

            const context = new de.Context();
            await context.run( block );

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect( body.toString() ).toBe( BODY.toString() );
        } );

        it.each( P_METHODS )( 'is an function returning object, method=%j', async ( method ) => {
            const path = get_path();

            const spy = jest.fn( ( req, res ) => res.end() );

            fake.add( path, spy );

            const BODY = {
                a: 'Привет!',
            };
            const block = base_block( {
                block: {
                    path: path,
                    method: method,
                    body: () => BODY,
                },
            } );

            const context = new de.Context();
            await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            const result = await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            const result = await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            const result = await context.run( block );

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
                    path: path,
                    is_json: true,
                },
            } );

            const context = new de.Context();
            const result = await context.run( block );

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
                    path: path,
                },
            } );

            expect.assertions( 2 );
            try {
                const context = new de.Context();
                await context.run( block );

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
                    path: path,
                    is_json: true,
                },
            } );

            expect.assertions( 2 );
            try {
                const context = new de.Context();
                await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            expect.assertions( 1 );
            try {
                await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            expect.assertions( 1 );
            try {
                await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            expect.assertions( 1 );
            try {
                await context.run( block );

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
                    path: path,
                    is_json: true,
                },
            } );

            const context = new de.Context();
            expect.assertions( 1 );
            try {
                await context.run( block );

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
                    path: path,
                },
            } );

            const context = new de.Context();
            expect.assertions( 1 );
            try {
                await context.run( block );

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
                    path: path,
                },

                options: {
                    name: NAME,
                },
            } );

            const context = new de.Context();
            const result = await context.run( block );

            expect( result.request_options.extra ).toEqual( {
                name: NAME,
            } );
        } );

    } );

} );

