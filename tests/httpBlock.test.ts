import http_ from 'http';

import url_ from 'url';

import qs_ from 'querystring';

import * as de from '../lib';

import Server from './server';

import { getPath, getResultBlock } from './helpers';
import type { ServerResponse, ClientRequest } from 'node:http';

import strip_null_and_undefined_values from '../lib/stripNullAndUndefinedValues';
import type { DescriptBlockOptions, DescriptHttpBlockResult } from '../lib/types';
import type { DescriptHttpBlockDescription } from '../lib/httpBlock';
import type { DescriptBlockId } from '../lib/depsDomain';
//  ---------------------------------------------------------------------------------------------------------------  //

describe('http', <
    Context,
    ParamsOut,
    HTTPResult,
>() => {

    const PORT = 10000;

    const baseBlock = <
        Context,
        ParamsOut,
        BlockResult extends DescriptHttpBlockResult<HTTPResult>,
        HTTPResult,

        BeforeResultOut = undefined,
        AfterResultOut = undefined,
        ErrorResultOut = undefined,
        Params = ParamsOut
    >({ block, options }: {
        block?: DescriptHttpBlockDescription<ParamsOut, Context, HTTPResult>;
        options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
    }) => de.http({
        block: {
            protocol: 'http:',
            hostname: '127.0.0.1',
            port: PORT,
            ...block,
        },
        options: {
            logger: new de.Logger({}),
            ...options,
        },
    });

    const fake = new Server({
        module: http_,
        listen_options: {
            port: PORT,
        },
    });

    beforeAll(() => fake.start());
    afterAll(() => fake.stop());

    describe('basic block properties', () => {
        const path = getPath();

        type P = 'method' | 'protocol' | 'port' | 'hostname' | 'pathname' | 'maxRetries' | 'timeout' | 'headers' | 'query' | 'body'

        const PROPS: Array<[ P, DescriptHttpBlockDescription<ParamsOut, Context, HTTPResult>[P]]> = [
            [ 'method', 'POST' ],
            [ 'protocol', 'http:' ],
            [ 'port', PORT ],
            [ 'hostname', '127.0.0.1' ],
            [ 'pathname', path ],
            [ 'maxRetries', 0 ],
            [ 'timeout', 100 ],
            [ 'headers', {} ],
            [ 'query', {} ],
            [ 'body', {} ],
        ];

        fake.add(path);

        it.each(PROPS)('%j is a function and it gets { params, context }', async(name, value) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((...args: any) => value);

            const block = baseBlock({
                block: {
                    pathname: path,
                    //  Чтобы body отработал.
                    method: 'POST',
                    [ name ]: spy,
                },
            });

            const params = {
                foo: 42,
            };
            const context = {
                req: true,
                res: true,
            };
            await de.run(block, { params, context });

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect(call.params).toBe(params);
            expect(call.context).toBe(context);
        });

        it.each(PROPS)('%j is a function and it gets { deps }', async(name, value) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((...args: any) => value);

            let fooResult;
            let id: DescriptBlockId;
            const block = de.func({
                block: ({ generateId }) => {
                    id = generateId();

                    return de.object({
                        block: {
                            foo: getResultBlock(() => {
                                fooResult = {
                                    foo: 42,
                                };
                                return fooResult;
                            }).extend({
                                options: {
                                    id: id,
                                },
                            }),

                            bar: baseBlock({
                                block: {
                                    pathname: path,
                                    method: 'POST',
                                    [ name ]: spy,
                                },

                                options: {
                                    deps: id,
                                },
                            }),

                            debor: de.func({
                                block: () => ({ fooResult: 1 }),
                            }),
                        },
                    });
                },
            });

            const result = await de.run(block);

            result.bar;

            const call = spy.mock.calls[ 0 ][ 0 ];
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(call.deps[ id ]).toBe(fooResult);
        });

    });

    /*
    it( 'path is a string', async () => {
        const path = getPath();

        const CONTENT = 'Привет!';

        fake.add( path, {
            statusCode: 200,
            content: CONTENT,
        } );

        const block = baseBlock( {
            block: {
                pathname: path,
            },
        } );

        const result = await de.run( block );

        expect( result.statusCode ).toBe( 200 );
        expect( result.result ).toBe( CONTENT );
    } );

    it( 'path is a function', async () => {
        const path = getPath();

        const CONTENT = 'Привет!';

        fake.add( path, {
            statusCode: 200,
            content: CONTENT,
        } );

        const block = baseBlock( {
            block: {
                pathname: () => path,
            },
        } );

        const result = await de.run( block );

        expect( result.statusCode ).toBe( 200 );
        expect( result.result ).toBe( CONTENT );
    } );
    */

    describe('headers', () => {

        it('is a function', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            let blockHeaders;
            const block = baseBlock({
                block: {
                    pathname: path,
                    headers: () => {
                        blockHeaders = {
                            'x-a': 'a',
                            'X-B': 'B',
                        };
                        return blockHeaders;
                    },
                },
            });

            await de.run(block);

            const headers = spy.mock.calls[ 0 ][ 0 ].headers;
            expect(headers[ 'x-a' ]).toBe('a');
            expect(headers[ 'x-b' ]).toBe('B');
        });

        it('is an object', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            const headerSpy = jest.fn(() => 'c');
            const block = baseBlock({
                block: {
                    pathname: path,
                    headers: {
                        'x-a': 'a',
                        'X-B': 'B',
                        'x-c': headerSpy,
                    },
                },
            });

            await de.run(block);

            const headers = spy.mock.calls[ 0 ][ 0 ].headers;
            expect(headers[ 'x-a' ]).toBe('a');
            expect(headers[ 'x-b' ]).toBe('B');
            expect(headers[ 'x-c' ]).toBe('c');
        });

        it('is an object and value function gets { params, context }', async() => {
            const path = getPath();

            fake.add(path);

            const spy = jest.fn<any, [any]>(() => 'a');
            const block = baseBlock({
                block: {
                    pathname: path,
                    headers: {
                        'x-a': spy,
                    },
                },
            });

            const params = {
                foo: 42,
            };
            const context = {
                context: true,
            };
            await de.run(block, { params, context });

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect(call.params).toBe(params);
            expect(call.context).toBe(context);
        });

        describe('inheritance', () => {

            it('child block is undefined', async() => {
                const path = getPath();

                const RESPONSE = 'Привет!';
                fake.add(path, (req: ClientRequest, res: ServerResponse) => res.end(RESPONSE));

                const parent = baseBlock({
                    block: {
                        pathname: path,
                    },
                });
                const child = parent.extend({ options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                } });

                const result = await de.run(child);

                expect(result.result).toBe(RESPONSE);
            });

            it('child is a function and it gets { headers }', async() => {
                const path = getPath();

                fake.add(path);

                const spy = jest.fn();

                let parentHeaders;
                const parent = baseBlock({
                    block: {
                        pathname: path,
                        headers: () => {
                            parentHeaders = {
                                'x-a': 'a',
                            };
                            return parentHeaders;
                        },
                    },
                });
                const child = parent.extend({
                    block: {
                        headers: spy,
                    },
                });

                await de.run(child);

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect(call.headers).toBe(parentHeaders);
            });

            it('child is an object', async() => {
                const path = getPath();

                const spy = jest.fn((req, res) => res.end());
                fake.add(path, spy);

                const headerSpy = jest.fn<any, [{headers: any}], any>(() => 'b');

                let parentHeaders;
                const parent = baseBlock({
                    block: {
                        pathname: path,
                        headers: () => {
                            parentHeaders = {
                                'x-a': 'a',
                            };
                            return parentHeaders;
                        },
                    },
                });
                const child = parent.extend({
                    block: {
                        headers: {
                            'x-b': headerSpy,
                            'X-C': 'C',
                        },
                    },
                });

                await de.run(child);

                const headerCall = headerSpy.mock.calls[ 0 ][ 0 ];
                expect(headerCall.headers).toBe(parentHeaders);

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect(call.headers[ 'x-a' ]).toBeUndefined();
                expect(call.headers[ 'x-b' ]).toBe('b');
                expect(call.headers[ 'x-c' ]).toBe('C');
            });

        });

    });

    describe('query', () => {

        it('is a function', async() => {
            const path = getPath();
            const spy = jest.fn((req, res) => res.end());
            fake.add(path, spy);

            const block = baseBlock({
                block: {
                    pathname: path,
                    query: () => {
                        return {
                            b: 'b',
                            a: 'a',
                            c: undefined,
                            d: '',
                            e: null,
                            f: 0,
                            g: false,
                        };
                    },
                },
            });

            await de.run(block);

            const req = spy.mock.calls[ 0 ][ 0 ];
            expect(url_.parse(req.url, true).query).toEqual({
                b: 'b',
                a: 'a',
                d: '',
                f: '0',
                g: 'false',
            });
        });

        it('is an object and value is null', async() => {
            const path = getPath();
            const spy = jest.fn((req, res) => res.end());
            fake.add(path, spy);

            const block = baseBlock({
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
            });

            const params = {
                a: null,
                b: undefined,
                c: 0,
                d: '',
                e: false,
                f: 'foo',
                g: 'bar',
            };
            await de.run(block, { params });

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse(req.url, true).query;
            //  NOTE: В ноде query сделано через Object.create( null ),
            //  так что toStrictEqual работает неправильно с ним.
            expect({ ...query }).toStrictEqual({
                a: '',
                c: '0',
                d: '',
                e: 'false',
                f: 'foo',
            });
        });

        it('is an object and value is undefined', async() => {
            const path = getPath();
            const spy = jest.fn((req, res) => res.end());
            fake.add(path, spy);

            const block = baseBlock({
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
            });

            const params = {
                a: null,
                b: undefined,
                c: 0,
                d: '',
                e: false,
                f: 'foo',
                g: 'bar',
            };
            await de.run(block, { params });

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse(req.url, true).query;
            expect({ ...query }).toStrictEqual({});
        });

        it('is an object and value is not null or undefined #1', async() => {
            const path = getPath();
            const spy = jest.fn((req, res) => res.end());
            fake.add(path, spy);

            const block = baseBlock({
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
            });

            const params = {};
            await de.run(block, { params });

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse(req.url, true).query;
            expect({ ...query }).toStrictEqual({
                a: '0',
                b: '',
                c: 'false',
                d: '42',
                e: 'foo',
            });
        });

        it('is an object and value is not null or undefined #2', async() => {
            const path = getPath();
            const spy = jest.fn((req, res) => res.end());
            fake.add(path, spy);

            const block = baseBlock({
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
            });

            const params = {
                a: 0,
                b: '',
                c: false,
                d: null,
                e: undefined,
            };
            await de.run(block, { params });

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse(req.url, true).query;
            expect({ ...query }).toStrictEqual({
                a: '0',
                b: '',
                c: 'false',
                d: '',
                e: 'foo',
            });
        });

        it('is an object and value function gets { params, context }', async() => {
            const path = getPath();
            fake.add(path);

            const spy = jest.fn();
            const block = baseBlock({
                block: {
                    pathname: path,
                    query: spy,
                },
            });

            const params = {
                foo: 42,
            };
            const context = {
                req: true,
                res: true,
            };
            await de.run(block, { params, context });

            const call = spy.mock.calls[ 0 ][ 0 ];
            expect(call.params).toBe(params);
            expect(call.context).toBe(context);
        });

        it('is an array of object and function', async() => {
            const path = getPath();
            const spy = jest.fn((req, res) => res.end());
            fake.add(path, spy);

            const params = {
                foo: 'foo',
                bar: 'bar',
                quu: 'quu',
            };

            const block = baseBlock({
                block: {
                    pathname: path,
                    query: [
                        {
                            foo: null,
                        },
                        ({ query, params }) => {
                            return {
                                ...query,
                                bar: params.bar,
                            };
                        },
                    ],
                },
                options: {
                    params: ({ params: p }: { params: typeof params }) => p,
                },
            });


            await de.run(block, { params });

            const req = spy.mock.calls[ 0 ][ 0 ];
            const query = url_.parse(req.url, true).query;
            expect({ ...query }).toStrictEqual({
                foo: 'foo',
                bar: 'bar',
            });
        });

        describe('inheritance', () => {

            it('child is a function and it gets { query }', async() => {
                const path = getPath();
                fake.add(path);

                let parentQuery;
                const parent = baseBlock({
                    block: {
                        pathname: path,
                        query: () => {
                            parentQuery = {
                                a: 'a',
                                b: undefined,
                                c: null,
                                d: 0,
                                e: '',
                                f: false,
                            };
                            return parentQuery;
                        },
                    },
                });

                const spy = jest.fn();
                const child = parent.extend({
                    block: {
                        query: spy,
                    },
                });

                await de.run(child);

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect(call.query).toStrictEqual(strip_null_and_undefined_values(parentQuery));
            });

            it('child is an object and value function gets { query }', async() => {
                const path = getPath();
                fake.add(path);

                let parentQuery;
                const parent = baseBlock({
                    block: {
                        pathname: path,
                        query: () => {
                            parentQuery = {
                                a: 'a',
                                b: undefined,
                                c: null,
                                d: 0,
                                e: '',
                                f: false,
                            };
                            return parentQuery;
                        },
                    },
                });

                const spy = jest.fn();
                const child = parent.extend({
                    block: {
                        query: {
                            bar: spy,
                        },
                    },
                });

                await de.run(child);

                const call = spy.mock.calls[ 0 ][ 0 ];
                expect(call.query).toStrictEqual(strip_null_and_undefined_values(parentQuery));
            });

        });

    });

    describe('body', () => {

        it('no body', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body).toBeNull();
        });

        it('is a string', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const BODY = 'Привет!';
            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: BODY,
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body.toString()).toBe(BODY);
        });

        it('is a number', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const BODY = 42;
            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: BODY,
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body.toString()).toBe(String(BODY));
        });

        it('is a Buffer', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const BODY = Buffer.from('Привет!');
            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: BODY,
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body.toString()).toBe(BODY.toString());
        });

        it('is a function returning string', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const BODY = 'Привет!';
            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: () => BODY,
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body.toString()).toBe(BODY);
        });

        it('is a function returning Buffer', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const BODY = Buffer.from('Привет!');
            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: () => BODY,
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body.toString()).toBe(BODY.toString());
        });

        it('is an function returning object', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const BODY = {
                a: 'Привет!',
            };
            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: () => BODY,
                },
            });

            await de.run(block);

            const body = spy.mock.calls[ 0 ][ 2 ];
            expect(body.toString()).toBe(qs_.stringify(BODY));
        });

        it('with body_compress', async() => {
            const path = getPath();

            const spy = jest.fn<any, any>((req, res) => res.end());

            fake.add(path, spy);

            const block = baseBlock({
                block: {
                    pathname: path,
                    method: 'POST',
                    body: 'Привет!',
                    bodyCompress: {},
                },
            });

            await de.run(block);

            expect(spy).toHaveBeenCalledTimes(1);
            const body = spy.mock.calls[ 0 ][ 2 ];
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(body).toBeValidGzip();
            expect(body).toHaveLength(34);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(body).toHaveUngzipValue('Привет!');
        });
    });

    describe('parse response', () => {

        it('text/plain', async() => {
            const path = getPath();

            const RESPONSE = Buffer.from('Привет!');
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.setHeader('content-length', Buffer.byteLength(RESPONSE));
                res.setHeader('content-type', 'text/plain');
                res.end(RESPONSE);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
                options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                },
            });

            const result = await de.run(block);

            expect(result.result.toString()).toBe(RESPONSE.toString());
        });

        it('application/json #1', async() => {
            const path = getPath();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                const buffer = Buffer.from(JSON.stringify(RESPONSE));
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'application/json');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
                options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                },
            });

            const result = await de.run(block);

            expect(result.result).toEqual(RESPONSE);
        });

        it('application/json #2', async() => {
            const path = getPath();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                const buffer = Buffer.from(JSON.stringify(RESPONSE));
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'application/json; charset=utf-8');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
                options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                },
            });

            const result = await de.run(block);

            expect(result.result).toEqual(RESPONSE);
        });

        it('application/json serialization', async() => {
            const path = getPath();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                const buffer = Buffer.from(JSON.stringify(RESPONSE));
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'application/json; charset=utf-8');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
                options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => JSON.stringify(result),
                },
            });

            const result = await de.run(block);

            expect(JSON.parse(result)).toEqual({
                headers: {
                    connection: 'keep-alive',
                    'content-length': '24',
                    'content-type': 'application/json; charset=utf-8',
                    date: expect.stringMatching(/^.* GMT$/),
                    'keep-alive': 'timeout=5',
                },
                result: {
                    text: 'Привет!',
                },
                statusCode: 200,
            });
        });

        it('text/plain, is_json: true', async() => {
            const path = getPath();

            const RESPONSE = {
                text: 'Привет!',
            };
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                const buffer = Buffer.from(JSON.stringify(RESPONSE));
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'text/plain');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                    isJson: true,
                },
                //TODO без этого бы прокидывать тип
                options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                },
            });

            const result = await de.run(block);

            expect(result.result).toEqual(RESPONSE);
        });

        it('invalid json in response, application/json', async() => {
            const path = getPath();

            const RESPONSE = Buffer.from('Привет!');
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.setHeader('content-length', Buffer.byteLength(RESPONSE));
                res.setHeader('content-type', 'application/json');
                res.end(RESPONSE);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
            });

            expect.assertions(2);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }

            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toEqual(de.ERROR_ID.INVALID_JSON);
        });

        it('invalid json in response, is_json: true', async() => {
            const path = getPath();

            const RESPONSE = Buffer.from('Привет!');
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.setHeader('content-length', Buffer.byteLength(RESPONSE));
                res.setHeader('content-type', 'text/plain');
                res.end(RESPONSE);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                    isJson: true,
                },
            });

            expect.assertions(2);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }

            expect(de.isError(e)).toBe(true);
            expect(e.error.id).toEqual(de.ERROR_ID.INVALID_JSON);
        });

        describe('empty body', () => {
            it('text/plain', async() => {
                const path = getPath();

                const RESPONSE = Buffer.from([]);
                fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                    res.setHeader('content-length', Buffer.byteLength(RESPONSE));
                    res.setHeader('content-type', 'text/plain');
                    res.end(RESPONSE);
                });

                const block = baseBlock({
                    block: {
                        pathname: path,
                    },

                    options: {
                        after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                    },
                });

                const result = await de.run(block);

                expect(result.result).toBeNull();
            });

            it('application/json', async() => {
                const path = getPath();

                const RESPONSE = Buffer.from([]);
                fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                    res.setHeader('content-length', Buffer.byteLength(RESPONSE));
                    res.setHeader('content-type', 'application/json');
                    res.end(RESPONSE);
                });

                const block = baseBlock({
                    block: {
                        pathname: path,
                    },

                    options: {
                        after: ({ result }: { result: DescriptHttpBlockResult<typeof RESPONSE> }) => result,
                    },
                });

                const result = await de.run(block);

                expect(result.result).toBeNull();
            });
        });

    });

    describe('parse error', () => {

        it('no body', async() => {
            const path = getPath();

            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.statusCode = 503;
                res.end();
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }

            expect(e.error.body).toBeNull();
        });

        it('text/plain', async() => {
            const path = getPath();

            const RESPONSE = 'Привет!';
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.statusCode = 503;
                const buffer = Buffer.from(RESPONSE);
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'text/plain');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }

            expect(e.error.body).toBe(RESPONSE);
        });

        it('application/json', async() => {
            const path = getPath();

            const RESPONSE = {
                error: 'Ошибка!',
            };
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.statusCode = 503;
                const buffer = Buffer.from(JSON.stringify(RESPONSE));
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'application/json');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },

            });

            expect.assertions(1);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }
            expect(e.error.body).toEqual(RESPONSE);
        });

        it('text/plain, is_json: true, invalid json in repsonse', async() => {
            const path = getPath();

            const RESPONSE = 'Привет!';
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.statusCode = 503;
                const buffer = Buffer.from(RESPONSE);
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'text/plain');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                    isJson: true,
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }
            expect(e.error.body).toBe(RESPONSE);
        });

        it('application/json, invalid json in repsonse', async() => {
            const path = getPath();

            const RESPONSE = 'Привет!';
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.statusCode = 503;
                const buffer = Buffer.from(RESPONSE);
                res.setHeader('content-length', Buffer.byteLength(buffer));
                res.setHeader('content-type', 'application/json');
                res.end(buffer);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
            });

            expect.assertions(1);
            let e;
            try {
                await de.run(block);

            } catch (error) {
                e = error;
            }
            expect(e.error.body).toBe(RESPONSE);
        });

    });

    describe('misc', () => {

        it('extra', async() => {
            const path = getPath();

            fake.add(path, {
                statusCode: 200,
            });

            const NAME = 'resource_name';
            const block = baseBlock({
                block: {
                    pathname: path,
                },

                options: {
                    name: NAME,
                    after: ({ result }: { result: DescriptHttpBlockResult<unknown> }) => result,
                },
            });

            const result = await de.run(block);

            expect(result.requestOptions.extra).toEqual({
                name: NAME,
            });
        });

        it('prepare_request_options', async() => {
            const path1 = getPath();
            const path2 = getPath();

            const spy1 = jest.fn((req, res) => res.end());
            const spy2 = jest.fn((req, res) => res.end());
            fake.add(path1, spy1);
            fake.add(path2, spy2);

            const block = baseBlock({
                block: {
                    pathname: path1,
                    prepareRequestOptions: (requestOptions) => {
                        return {
                            ...requestOptions,
                            pathname: path2,
                        };
                    },
                },
            });

            await de.run(block);

            expect(spy1.mock.calls).toHaveLength(0);
            expect(spy2.mock.calls).toHaveLength(1);
        });

        it('default parse_body', async() => {
            const path = getPath();

            const CONTENT = 'Привет!';

            fake.add(path, {
                statusCode: 200,
                content: CONTENT,
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                },
                options: {
                    after: ({ result }: { result: DescriptHttpBlockResult<typeof CONTENT> }) => result,
                },
            });

            const result = await de.run(block);

            expect(result.statusCode).toBe(200);
            expect(result.result).toBe(CONTENT);
        });

        it('custom parse_body', async() => {
            const path = getPath();

            const CONTENT = 'Привет!';

            fake.add(path, {
                statusCode: 200,
                content: CONTENT,
            });

            const BODY = 'Пока!';
            const spy = jest.fn<any, any>(() => {
                return BODY;
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                    parseBody: spy,
                },
            });

            const context = {};
            const result = await de.run(block, { context });

            const [ aResult, aContext ] = spy.mock.calls[ 0 ];
            expect(result.result).toBe(BODY);
            expect(Buffer.compare(aResult.body, Buffer.from(CONTENT))).toBe(0);
            expect(aContext).toBe(context);
        });

        it('custom parse_body should process empty body', async() => {
            const path = getPath();

            const RESPONSE = Buffer.from([]);
            fake.add(path, (req: ClientRequest, res: ServerResponse) => {
                res.setHeader('content-length', Buffer.byteLength(RESPONSE));
                res.setHeader('content-type', 'application/protobuf');
                res.end(RESPONSE);
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                    parseBody: ({ body }) => {
                        if (!body || Buffer.byteLength(body) === 0) {
                            return {};

                        } else {
                            return null;
                        }
                    },

                },
            });

            const context = {};
            const result = await de.run(block, { context });

            expect(result?.result).toEqual({});
        });

        it('custom parse_body for error', async() => {
            const path = getPath();

            const CONTENT = 'Привет!';

            fake.add(path, {
                statusCode: 500,
                content: CONTENT,
            });

            const BODY = 'Пока!';
            const spy = jest.fn<any, any>(() => {
                return BODY;
            });

            const block = baseBlock({
                block: {
                    pathname: path,
                    parseBody: spy,
                },
            });

            expect.assertions(3);

            const context = {};
            let e;
            try {
                await de.run(block, { context });
            } catch (error) {
                e = error;
            }

            const [ aResult, aContext ] = spy.mock.calls[ 0 ];
            expect(e.error.body).toBe(BODY);
            expect(Buffer.compare(aResult.body, Buffer.from(CONTENT))).toBe(0);
            expect(aContext).toBe(context);
        });

    });

});
