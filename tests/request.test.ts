/* eslint-disable jest/no-conditional-expect */
import url_ from 'url';

import qs_ from 'querystring';

import { getPath, waitForValue } from './helpers';
import Server from './server';
import type { DescriptRequestOptions } from '../lib/request';
import request, { DEFAULT_OPTIONS } from '../lib/request';
import * as de from '../lib';
import { Duplex } from 'stream';
import { compress } from '@fengkx/zstd-napi';
import { gzipSync } from 'node:zlib';
import https_ from 'https';
import http from 'http';
import fs_ from 'fs';
import path_ from 'path';
import type Cancel from '../lib/cancel';
import type Logger from '../lib/logger';


//  ---------------------------------------------------------------------------------------------------------------  //

function getDoRequest(defaultOptions: DescriptRequestOptions) {
    return function doRequest(options: DescriptRequestOptions = {}, logger?: Logger, cancel?: Cancel) {
        logger = logger || new de.Logger({ debug: true });
        cancel = cancel || new de.Cancel();

        return request({ ...defaultOptions, ...options }, logger, cancel);
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

describe('request', () => {

    describe('http', () => {

        const PORT = 9000;
        const PORT_IPV6 = 9006;

        const doRequest = getDoRequest({
            protocol: 'http:',
            hostname: '127.0.0.1',
            port: PORT,
            pathname: '/',
        });

        const fake = new Server({
            module: http,
            listen_options: {
                port: PORT,
            },
        });

        const fakeIpv6 = new Server({
            module: http,
            listen_options: {
                host: '::1',
                port: PORT_IPV6,
                ipv6Only: true,
            },
        });

        beforeAll(() => Promise.all([
            fake.start(),
            fakeIpv6.start(),
        ]));
        afterAll(() => Promise.all([
            fake.stop(),
            fakeIpv6.stop(),
        ]));

        it.each([ 'GET', 'DELETE' ])('%j', async(method) => {
            const path = getPath();

            const CONTENT = 'Привет!';

            fake.add(path, {
                statusCode: 200,
                content: CONTENT,
            });

            const result = await doRequest({
                method: method,
                pathname: path,
            });

            expect(result.statusCode).toBe(200);
            expect(Buffer.isBuffer(result.body)).toBe(true);
            expect(result.body?.toString()).toBe(CONTENT);
        });

        it('pathname always starts with /', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            await doRequest({
                pathname: path.replace(/^\//, ''),
            });

            const [ req ] = spy.mock.calls[ 0 ];

            expect(url_.parse(req.url).pathname).toBe(path);
        });

        it('sets accept-encoding to gzip,deflate', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            await doRequest({
                pathname: path,
            });

            const [ req ] = spy.mock.calls[ 0 ];

            expect(req.headers[ 'accept-encoding' ]).toBe('gzip,deflate');
        });

        it('adds gzip,deflate to accept-encoding', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            await doRequest({
                pathname: path,
                headers: {
                    'accept-encoding': 'compress',
                },
            });

            const [ req ] = spy.mock.calls[ 0 ];

            expect(req.headers[ 'accept-encoding' ]).toBe('gzip,deflate,compress');
        });

        it('sends lower-cased headers', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            await doRequest({
                pathname: path,
                headers: {
                    'x-request-foo': 'Foo',
                    'X-REQUEST-BAR': 'bAr',
                    'X-Request-Quu': 'quU',
                },
            });

            const [ req ] = spy.mock.calls[ 0 ];

            expect(req.headers[ 'x-request-foo' ]).toBe('Foo');
            expect(req.headers[ 'x-request-bar' ]).toBe('bAr');
            expect(req.headers[ 'x-request-quu' ]).toBe('quU');
        });

        it('query', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            fake.add(path, spy);

            const QUERY = {
                foo: 42,
                bar: 'Привет!',
            };

            await doRequest({
                pathname: path,
                query: QUERY,
            });

            const [ req ] = spy.mock.calls[ 0 ];

            expect(url_.parse(req.url, true).search).toEqual('?' + qs_.stringify(QUERY));
        });

        it('basic auth', async() => {
            const path = getPath();

            const spy = jest.fn((req, res) => res.end());

            const AUTH = 'user:password';

            fake.add(path, spy);

            await doRequest({
                pathname: path,
                auth: AUTH,
            });

            const [ req ] = spy.mock.calls[ 0 ];

            const authHeader = req.headers[ 'authorization' ].replace(/^Basic\s*/, '');
            expect(Buffer.from(authHeader, 'base64').toString()).toBe(AUTH);
        });

        it('invalid protocol', async() => {
            const path = getPath();

            const CONTENT = 'Привет!';

            fake.add(path, {
                statusCode: 200,
                content: CONTENT,
            });

            expect.assertions(1);
            try {
                await doRequest({
                    protocol: 'http',
                    pathname: path,
                });

            } catch (error) {
                expect(de.isError(error)).toBe(true);
            }
        });

        it.each([ 'POST', 'PUT', 'PATCH' ])('%j, body is a Buffer', async(method) => {
            const path = getPath();

            const BODY = Buffer.from('Привет!');

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect(req.method).toBe(method);
            expect(req.headers[ 'content-type' ]).toBe('application/octet-stream');
            expect(Number(req.headers[ 'content-length' ])).toBe(BODY.length);
            expect(Buffer.compare(BODY, body)).toBe(0);
        });

        it.each([ 'POST', 'PUT', 'PATCH', 'DELETE' ])('%j, body is a string', async(method) => {
            const path = getPath();

            const BODY = 'Привет!';

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect(req.method).toBe(method);
            expect(req.headers[ 'content-type' ]).toBe('text/plain');
            expect(Number(req.headers[ 'content-length' ])).toBe(Buffer.byteLength(BODY));
            expect(body.toString()).toBe(BODY);
        });

        it.each([ 'POST', 'PUT', 'PATCH', 'DELETE' ])('%j, body is a string, custom content-type', async(method) => {
            const path = getPath();

            const BODY = 'div { color: red; }';

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
                headers: {
                    'content-type': 'text/css',
                },
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect(req.method).toBe(method);
            expect(req.headers[ 'content-type' ]).toBe('text/css');
            expect(Number(req.headers[ 'content-length' ])).toBe(Buffer.byteLength(BODY));
            expect(body.toString()).toBe(BODY);
        });

        it.each([ 'POST', 'PUT', 'PATCH', 'DELETE' ])('%j, body is an object', async(method) => {
            const path = getPath();

            const BODY = {
                id: 42,
                text: 'Привет!',
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];
            const bodyString = qs_.stringify(BODY);

            expect(req.method).toBe(method);
            expect(req.headers[ 'content-type' ]).toBe('application/x-www-form-urlencoded');
            expect(Number(req.headers[ 'content-length' ])).toBe(Buffer.byteLength(bodyString));
            expect(body.toString()).toBe(bodyString);
        });

        it.each([ 'POST', 'PUT', 'PATCH', 'DELETE' ])('%j, body is an object, content-type is application/json', async(method) => {
            const path = getPath();

            const BODY = {
                id: 42,
                text: 'Привет!',
            };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
                headers: {
                    'content-type': 'application/json',
                },
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];
            const bodyString = JSON.stringify(BODY);

            expect(req.method).toBe(method);
            expect(req.headers[ 'content-type' ]).toBe('application/json');
            expect(Number(req.headers[ 'content-length' ])).toBe(Buffer.byteLength(bodyString));
            expect(body.toString()).toBe(bodyString);
        });

        it.each([ 'POST' ])('%j, bodyCompress', async(method) => {
            const path = getPath();

            const BODY = 'Привет!'.repeat(1000);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
                bodyCompress: {},
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect(req.method).toBe(method);
            expect(req.headers).toHaveProperty('content-type', 'text/plain');
            expect(req.headers).toHaveProperty('content-encoding', 'gzip');
            expect(req.headers).toHaveProperty('transfer-encoding', 'chunked');
            expect(req.headers).not.toHaveProperty('content-length');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(body).toBeValidGzip();
            expect(body).toHaveLength(77);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(body).toHaveUngzipValue(BODY);
        });

        it.each([ 'POST' ])('%j, bodyCompress with options', async(method) => {
            const path = getPath();

            const BODY = 'Привет!'.repeat(1000);

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const spy = jest.fn((req: http.IncomingMessage, res: http.OutgoingMessage, body: any) => res.end());

            fake.add(path, spy);

            await doRequest({
                method: method,
                pathname: path,
                body: BODY,
                bodyCompress: {
                    level: 1,
                },
            });

            const [ req, , body ] = spy.mock.calls[ 0 ];

            expect(req.method).toBe(method);
            expect(req.headers).toHaveProperty('content-type', 'text/plain');
            expect(req.headers).toHaveProperty('content-encoding', 'gzip');
            expect(req.headers).toHaveProperty('transfer-encoding', 'chunked');
            expect(req.headers).not.toHaveProperty('content-length');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(body).toBeValidGzip();
            expect(body).toHaveLength(134);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(body).toHaveUngzipValue(BODY);
        });

        describe('errors', () => {

            it('2xx, custom isError', async() => {
                const path = getPath();
                const statusCode = 200;

                fake.add(path, {
                    statusCode: statusCode,
                });

                expect.assertions(2);
                try {
                    await doRequest({
                        pathname: path,
                        isError: () => true,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.statusCode).toBe(statusCode);
                }
            });

            it('4xx, maxRetries=1', async() => {
                const path = getPath();
                const statusCode = 404;

                const spy = jest.fn((res) => res.end());

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    spy,
                ]);

                expect.assertions(3);
                try {
                    await doRequest({
                        pathname: path,
                        maxRetries: 1,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.statusCode).toBe(statusCode);
                    expect(spy.mock.calls).toHaveLength(0);
                }
            });

            it('4xx, maxRetries=1, custom isRetryAllowed', async() => {
                const path = getPath();
                const statusCode = 404;
                const CONTENT = 'Привет!';

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    {
                        statusCode: 200,
                        content: CONTENT,
                    },
                ]);

                const result = await doRequest({
                    pathname: path,
                    maxRetries: 1,
                    isRetryAllowed: () => true,
                });

                expect(result.statusCode).toBe(200);
                expect(result.body?.toString()).toBe(CONTENT);
            });

            it('5xx, maxRetries=0', async() => {
                const path = getPath();
                const statusCode = 503;

                const spy = jest.fn((res) => res.end());

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    spy,
                ]);

                expect.assertions(3);
                try {
                    await doRequest({
                        pathname: path,
                        maxRetries: 0,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.statusCode).toBe(statusCode);
                    expect(spy.mock.calls).toHaveLength(0);
                }
            });

            it('5xx, maxRetries=1, custom isRetryAllowed', async() => {
                const path = getPath();
                const statusCode = 503;

                const spy = jest.fn((res) => res.end());

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    spy,
                ]);

                expect.assertions(3);
                try {
                    await doRequest({
                        pathname: path,
                        maxRetries: 1,
                        isRetryAllowed: () => false,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.statusCode).toBe(statusCode);
                    expect(spy.mock.calls).toHaveLength(0);
                }
            });

            it('5xx, maxRetries=1', async() => {
                const path = getPath();
                const statusCode = 503;
                const CONTENT = 'Привет!';

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    {
                        statusCode: 200,
                        content: CONTENT,
                    },
                ]);

                const result = await doRequest({
                    pathname: path,
                    maxRetries: 1,
                });

                expect(result.statusCode).toBe(200);
                expect(result.body?.toString()).toBe(CONTENT);
            });

            it('5xx, maxRetries=1, retryTimeout=0', async() => {
                const path = getPath();
                const statusCode = 503;
                const CONTENT = 'Привет!';

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    {
                        statusCode: 200,
                        content: CONTENT,
                    },
                ]);

                const result = await doRequest({
                    pathname: path,
                    maxRetries: 1,
                    retryTimeout: 0,
                });

                expect(result.statusCode).toBe(200);
                expect(result.body?.toString()).toBe(CONTENT);
            });

            it('5xx, maxRetries=1, retryTimeout=100', async() => {
                const path = getPath();

                let end = 0;

                fake.add(path, [
                    {
                        statusCode: 503,
                    },
                    (req: http.IncomingMessage, res: http.ServerResponse) => {
                        end = Date.now();

                        res.statusCode = 200;
                        res.end();
                    },
                ]);

                const retryTimeout = 100;

                const start = Date.now();
                await doRequest({
                    pathname: path,
                    maxRetries: 1,
                    retryTimeout: retryTimeout,
                });

                expect(end - start > retryTimeout).toBe(true);
            });

            it.each([ 'POST', 'PATCH' ])('5xx, %j, maxRetries=1, no retry', async(method) => {
                const path = getPath();
                const statusCode = 503;

                const spy = jest.fn((res) => res.end());

                fake.add(path, [
                    {
                        statusCode: statusCode,
                    },
                    spy,
                ]);

                expect.assertions(2);
                try {
                    await doRequest({
                        pathname: path,
                        method: method,
                        maxRetries: 1,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.statusCode).toBe(statusCode);
                }
            });

            it('timeout', async() => {
                const path = getPath();

                fake.add(path, {
                    statusCode: 200,
                    //  Тут wait работает так: сперва 100 мс таймаут, а потом уже ответ.
                    //  Следующий пример про наборот, когда сразу statusCode = 200 и res.write(),
                    //  а через таймаут только res.end().
                    //
                    wait: 100,
                });

                expect.assertions(2);
                try {
                    await doRequest({
                        pathname: path,
                        timeout: 50,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.id).toBe(de.ERROR_ID.REQUEST_TIMEOUT);
                }
            });

            it('200, timeout, incomplete response', async() => {
                const path = getPath();

                fake.add(path, async(req: http.IncomingMessage, res: http.ServerResponse) => {
                    res.statusCode = 200;
                    res.write('Привет!');
                    await waitForValue(null, 100);
                    res.end();
                });

                expect.assertions(2);
                try {
                    await doRequest({
                        pathname: path,
                        timeout: 50,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.id).toBe(de.ERROR_ID.REQUEST_TIMEOUT);
                }
            });

        });

        describe('content-encoding', () => {

            describe('zlib', () => {
                it('decompress', async() => {
                    const path = getPath();

                    const CONTENT = 'Привет!';

                    fake.add(path, function(req: http.IncomingMessage, res: http.OutgoingMessage) {
                        const buffer = gzipSync(Buffer.from(CONTENT));

                        res.setHeader('content-encoding', 'gzip');
                        res.setHeader('content-length', Buffer.byteLength(buffer));
                        res.end(buffer);
                    });

                    const result = await doRequest({
                        pathname: path,
                    });

                    expect(result.body?.toString()).toBe(CONTENT);
                });

                it('decompress with error', async() => {
                    const path = getPath();

                    const CONTENT = 'Привет!';

                    fake.add(path, function(req: http.IncomingMessage, res: http.OutgoingMessage) {
                        //  Шлем контент, не являющийся gzip'ом.
                        const buffer = Buffer.from(CONTENT);

                        res.setHeader('content-encoding', 'gzip');
                        res.setHeader('content-length', Buffer.byteLength(buffer));
                        res.end(buffer);
                    });

                    expect.assertions(3);
                    try {
                        await doRequest({
                            pathname: path,
                        });

                    } catch (error) {
                        expect(de.isError(error)).toBe(true);
                        expect(error.error.id).toBe('UNKNOWN_ERROR');
                        expect(error.error.code).toBe('Z_DATA_ERROR');
                    }
                });
            });

            describe('zstd', () => {
                it('decompress', async() => {
                    const path = getPath();

                    const CONTENT = 'Привет!';
                    const buffer = Buffer.from(CONTENT);
                    const stream = new Duplex();
                    stream.push(await compress(buffer));
                    stream.push(null);

                    fake.add(path, function(req: http.IncomingMessage, res: http.OutgoingMessage) {
                        res.setHeader('content-encoding', 'zstd');

                        stream.pipe(res);
                    });

                    const result = await doRequest({
                        pathname: path,
                    });

                    expect(result.body?.toString()).toBe(CONTENT);
                });

                it('decompress with error', async() => {
                    const path = getPath();

                    const CONTENT = 'Привет!';

                    fake.add(path, function(req: http.IncomingMessage, res: http.OutgoingMessage) {
                        const buffer = Buffer.from(CONTENT);

                        res.setHeader('content-encoding', 'zstd');
                        res.end(buffer);
                    });

                    expect.assertions(3);
                    try {
                        await doRequest({
                            pathname: path,
                        });

                    } catch (error) {
                        expect(de.isError(error)).toBe(true);
                        expect(error.error.id).toBe('UNKNOWN_ERROR');
                        expect(error.error.code).toBe('GenericFailure');
                    }
                });
            });

        });

        describe('agent', () => {

            it('is an object', async() => {
                const path = getPath();

                fake.add(path, {
                    statusCode: 200,
                });

                const agent = {
                    keepAlive: true,
                };

                await doRequest({
                    pathname: path,
                    agent: agent,
                });
                const result2 = await doRequest({
                    pathname: path,
                    agent: agent,
                });

                expect(result2.timestamps.socket === result2.timestamps.tcpConnection).toBe(true);
            });

            it('is an http.Agent instance', async() => {
                const path = getPath();

                fake.add(path, {
                    statusCode: 200,
                });

                const agent = new http.Agent({
                    keepAlive: true,
                });

                await doRequest({
                    pathname: path,
                    agent: agent,
                });
                const result2 = await doRequest({
                    pathname: path,
                    agent: agent,
                });

                expect(result2.timestamps.socket === result2.timestamps.tcpConnection).toBe(true);
            });

        });

        describe('family', () => {

            it('family: 6', async() => {
                const path = getPath();

                const CONTENT = 'Привет!';

                fakeIpv6.add(path, {
                    statusCode: 200,
                    content: CONTENT,
                });

                const result = await doRequest({
                    family: 6,
                    hostname: 'localhost',
                    method: 'GET',
                    pathname: path,
                    port: PORT_IPV6,
                });

                expect(result.statusCode).toBe(200);
                expect(Buffer.isBuffer(result.body)).toBe(true);
                expect(result.body?.toString()).toBe(CONTENT);
            });

        });

        describe('cancel', () => {

            it('cancel before request ended', async() => {
                const path = getPath();

                fake.add(path, {
                    statusCode: 200,
                    wait: 200,
                });

                const error = de.error({
                    id: 'SOME_ERROR',
                });
                const cancel = new de.Cancel();
                setTimeout(() => {
                    cancel.cancel(error);
                }, 50);

                expect.assertions(3);
                try {
                    await doRequest({
                        pathname: path,
                    }, undefined, cancel);

                } catch (e) {
                    expect(de.isError(e)).toBe(true);
                    expect(e.error.id).toBe(de.ERROR_ID.HTTP_REQUEST_ABORTED);
                    expect(e.error.reason).toBe(error);
                }
            });

            it('cancel after request ended', async() => {
                const path = getPath();

                const CONTENT = 'Привет!';
                fake.add(path, {
                    statusCode: 200,
                    content: CONTENT,
                    wait: 50,
                });

                const error = de.error({
                    id: 'SOME_ERROR',
                });
                const cancel = new de.Cancel();
                setTimeout(() => {
                    cancel.cancel(error);
                }, 100);

                const result = await doRequest({
                    pathname: path,
                }, undefined, cancel);

                expect(result.body?.toString()).toBe(CONTENT);
            });

        });

    });

    describe('https', () => {

        const PORT = 9001;

        const doRequest = getDoRequest({
            protocol: 'https:',
            hostname: '127.0.0.1',
            port: PORT,
            pathname: '/',
        });

        let serverKey;
        let serverCert;
        try {
            serverKey = fs_.readFileSync(path_.join(__dirname, 'server.key'));
            serverCert = fs_.readFileSync(path_.join(__dirname, 'server.crt'));

        } catch (e) {
            throw Error(
                'Generate https keys:\n' +
                '    cd tests\n' +
                '    ./gen-certs.sh\n',
            );
        }

        const fake = new Server({
            module: https_,
            listen_options: {
                port: PORT,
            },
            options: {
                key: serverKey,
                cert: serverCert,
            },
        });

        beforeAll(() => fake.start());
        afterAll(() => fake.stop());

        it('GET', async() => {
            const path = getPath();

            const CONTENT = 'Привет!';

            fake.add(path, {
                statusCode: 200,
                content: CONTENT,
            });

            const result = await doRequest({
                rejectUnauthorized: false,
                pathname: path,
            });

            expect(Buffer.isBuffer(result.body)).toBe(true);
            expect(result.body?.toString()).toBe(CONTENT);
        });

    });

    describe('default options', () => {

        describe('isError', () => {

            const isError = DEFAULT_OPTIONS.isError!;

            it.each([ de.ERROR_ID.TCP_CONNECTION_TIMEOUT, de.ERROR_ID.REQUEST_TIMEOUT ])('errorId=%j', (errorId) => {
                const error = de.error({
                    id: errorId,
                });

                expect(isError(error)).toBe(true);
            });

            it.each([ 200, 301, 302, 303, 304 ])('statusCode=%j', (statusCode) => {
                const error = de.error({
                    statusCode: statusCode,
                });

                expect(isError(error)).toBe(false);
            });

            it.each([ 400, 401, 402, 403, 404, 500, 501, 503 ])('statusCode=%j', (statusCode) => {
                const error = de.error({
                    statusCode: statusCode,
                });

                expect(isError(error)).toBe(true);
            });

        });

    });

    describe('aborted request', () => {

        describe('no bytes sent', () => {
            const server = http.createServer((req: http.IncomingMessage, res: http.OutgoingMessage) => {
                setTimeout(() => {
                    res.socket?.destroy();
                }, 100);
            });
            const PORT = 9002;

            beforeAll(() => serverListen(server, PORT));
            afterAll(() => serverClose(server));

            it('1', async() => {
                const doRequest = getDoRequest({
                    protocol: 'http:',
                    hostname: '127.0.0.1',
                    port: PORT,
                    pathname: '/',
                });

                const path = getPath();

                expect.assertions(2);
                try {
                    await doRequest({
                        pathname: path,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.id).toBe(de.ERROR_ID.HTTP_UNKNOWN_ERROR);
                }
            });
        });

        describe('some bytes sent', () => {
            const server = http.createServer((req: http.IncomingMessage, res: http.OutgoingMessage) => {
                res.write('Hello!');
                setTimeout(() => {
                    res.socket?.destroy();
                }, 100);
            });
            const PORT = 9003;

            const doRequest = getDoRequest({
                protocol: 'http:',
                hostname: '127.0.0.1',
                port: PORT,
            });

            beforeAll(() => serverListen(server, PORT));
            afterAll(() => serverClose(server));

            it('1', async() => {
                expect.assertions(2);
                try {
                    await doRequest();

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.id).toBe(de.ERROR_ID.INCOMPLETE_RESPONSE);
                }
            });

            it('cancelled', async() => {
                const cancel = new de.Cancel();
                const error = de.error({
                    id: 'SOME_ERROR',
                });
                setTimeout(() => {
                    cancel.cancel(error);
                }, 50);

                expect.assertions(3);
                try {
                    await doRequest({}, undefined, cancel);

                } catch (e) {
                    expect(de.isError(e)).toBe(true);
                    expect(e.error.id).toBe(de.ERROR_ID.HTTP_REQUEST_ABORTED);
                    expect(e.error.reason).toBe(error);
                }
            });

        });

        describe('tcp connection timeout', () => {
            const PORT = 9004;
            const server = http.createServer((req, res) => {
                setTimeout(() => res.end(), 100);
            });

            const doRequest = getDoRequest({
                protocol: 'http:',
                hostname: '127.0.0.1',
                port: PORT,
            });

            beforeAll(() => serverListen(server, PORT));
            afterAll(() => serverClose(server));

            it('1', async() => {
                expect.assertions(2);
                try {
                    const agent = {
                        keepAlive: false,
                        maxSockets: 1,
                    };

                    //  Делаем запрос и занимаем весь один сокет.
                    doRequest({
                        agent: agent,
                    });
                    //  Так что этот запрос не сможет законнектиться.
                    await doRequest({
                        agent: agent,
                        //  Тут должно быть что-то меньшее, чем время, за которое отвечает сервер.
                        timeout: 50,
                    });

                } catch (error) {
                    expect(de.isError(error)).toBe(true);
                    expect(error.error.id).toBe(de.ERROR_ID.TCP_CONNECTION_TIMEOUT);
                }
            });

        });

    });

});

function serverListen(server: http.Server, port: number) {
    return new Promise((resolve) => {
        server.listen(port, resolve as () => void);
    });
}

function serverClose(server: http.Server) {
    return new Promise((resolve) => {
        server.close(resolve);
    });
}
