import http_ from 'http';
import type {
    Agent as HttpsAgent,
    AgentOptions as HttpsAgentOptions,
    RequestOptions as HttpsRequestOptions,
} from 'https';
import https_ from 'https';
import type { ParsedUrlQueryInput } from 'querystring';
import qs_ from 'querystring';
import url_ from 'url';
import type { ZlibOptions } from 'node:zlib';
import { createGzip, createUnzip } from 'node:zlib';
import { decompress } from '@fengkx/zstd-napi';
import type { TransformOptions, TransformCallback } from 'stream';
import { Transform } from 'stream';

import type { EventTimestamps, LoggerEvent } from './logger';
import type Logger from './logger';
import { EVENT } from './logger';

import type { Deffered } from './getDeferred';
import getDeferred from './getDeferred';
import type Cancel from './cancel';
import type { DescriptError, Reason } from './error';
import { createError, ERROR_ID } from './error';
import is_plain_object from './isPlainObject';

import extend from './extend';
import type http from 'node:http';
import type { DescriptHttpResult, DescriptJSON } from './types';

//  ---------------------------------------------------------------------------------------------------------------  //

//  FIXME: А зачем тут WeakMap, а не просто Map?
//
const agentsCacheHttp = new WeakMap();
const agentsCacheHttps = new WeakMap();

const RX_IS_JSON = /^application\/json(?:;|\s|$)/;

export interface DescriptRequestOptions {
    protocol?: HttpsRequestOptions['protocol'];
    hostname?: HttpsRequestOptions['hostname'];
    port?: HttpsRequestOptions['port'];
    method?: HttpsRequestOptions['method'];
    pathname?: string;
    family?: HttpsRequestOptions['family'];
    auth?: HttpsRequestOptions['auth'];
    headers?: HttpsRequestOptions['headers'];

    pfx?: HttpsRequestOptions['pfx'];
    key?: HttpsRequestOptions['key'];
    passphrase?: HttpsRequestOptions['passphrase'];
    cert?: HttpsRequestOptions['cert'];
    ca?: HttpsRequestOptions['ca'];
    ciphers?: HttpsRequestOptions['ciphers'];
    rejectUnauthorized?: HttpsRequestOptions['rejectUnauthorized'];
    secureProtocol?: HttpsRequestOptions['secureProtocol'];
    servername?: HttpsRequestOptions['servername'];

    query?: string | ParsedUrlQueryInput;

    isError?: (error: DescriptError) => boolean;

    isRetryAllowed?: (error: DescriptError, requestOptions: RequestOptions) => boolean;
    body?: string |
    Buffer |
    DescriptJSON;

    maxRetries?: number;
    retryTimeout?: number;

    retries?: number;

    extra?: {
        name: string;
    };

    timeout?: number;

    bodyCompress?: ZlibOptions;

    agent?: HttpsAgent | HttpsAgentOptions | false | null;
}

//  ---------------------------------------------------------------------------------------------------------------  //

export const DEFAULT_OPTIONS = {
    method: 'GET',
    protocol: 'http:',
    hostname: 'localhost',
    pathname: '/',

    isError: function(error: DescriptError) {
        const id = error.error.id;
        const statusCode = Number(error.error.statusCode);

        return (
            id === ERROR_ID.TCP_CONNECTION_TIMEOUT ||
            id === ERROR_ID.REQUEST_TIMEOUT ||
            statusCode >= 400
        );
    },

    isRetryAllowed: function(error: DescriptError, requestOptions: RequestOptions) {
        const method = requestOptions.httpOptions.method;
        if (method === 'POST' || method === 'PATCH') {
            return false;
        }

        const id = error.error.id;
        const statusCode = Number(error.error.statusCode);

        return (
            id === ERROR_ID.TCP_CONNECTION_TIMEOUT ||
            id === ERROR_ID.REQUEST_TIMEOUT ||
            statusCode === 408 ||
            statusCode === 429 ||
            statusCode === 500 ||
            (statusCode >= 502 && statusCode <= 504)
        );
    },

    maxRetries: 0,

    retryTimeout: 100,
};

export class RequestOptions {

    isError: DescriptRequestOptions['isError'];
    isRetryAllowed: DescriptRequestOptions['isRetryAllowed'];
    maxRetries: number;
    retries: number;
    retryTimeout: number;
    timeout: DescriptRequestOptions['timeout'];
    bodyCompress: DescriptRequestOptions['bodyCompress'];
    httpOptions: HttpsRequestOptions;
    body: DescriptRequestOptions['body'];
    extra: DescriptRequestOptions['extra'];

    url: string;

    requestModule: typeof https_ | typeof http_;

    constructor(options: DescriptRequestOptions) {
        //  NOTE: Тут не годится Object.assign, так как ключи с undefined перезатирают все.
        options = extend({}, DEFAULT_OPTIONS, options);

        this.isError = options.isError;
        this.isRetryAllowed = options.isRetryAllowed;
        this.maxRetries = options.maxRetries || 0;
        this.retryTimeout = options.retryTimeout || 0;

        this.retries = options.retries || 0;

        this.timeout = options.timeout;
        this.bodyCompress = options.bodyCompress;

        this.httpOptions = {};

        this.httpOptions.protocol = options.protocol;
        this.httpOptions.hostname = options.hostname;
        this.httpOptions.port = options.port;

        if (options.family) {
            this.httpOptions.family = options.family;
        }
        if (!this.httpOptions.port) {
            this.httpOptions.port = (this.httpOptions.protocol === 'https:') ? 443 : 80;
        }

        let pathname = options.pathname;
        if (pathname?.charAt(0) !== '/') {
            pathname = '/' + pathname;
        }

        this.httpOptions.path = url_.format({
            pathname: pathname,
            query: options.query,
        });

        if (options.auth) {
            this.httpOptions.auth = options.auth;
        }

        //  Нужно для логов.
        this.url = url_.format({
            ...this.httpOptions,
            //  url.format игнорит свойство path, но смотрит на pathname + query/search.
            pathname: pathname,
            query: options.query,
        });

        this.httpOptions.headers = {};
        if (options.headers) {
            for (const name in options.headers) {
                this.httpOptions.headers[ name.toLowerCase() ] = options.headers[ name ];
            }
        }
        //  Add gzip headers.
        if (this.httpOptions.headers[ 'accept-encoding' ]) {
            this.httpOptions.headers[ 'accept-encoding' ] = 'gzip,deflate,' + this.httpOptions.headers[ 'accept-encoding' ];

        } else {
            this.httpOptions.headers[ 'accept-encoding' ] = 'gzip,deflate';
        }

        const method = this.httpOptions.method = options.method?.toUpperCase();

        this.body = null;
        if (options.body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
            if (Buffer.isBuffer(options.body)) {
                this.body = options.body;
                this.setContentType('application/octet-stream');

            } else if (typeof options.body !== 'object') {
                this.body = String(options.body);
                this.setContentType('text/plain');

            } else if (RX_IS_JSON.test(String(this.httpOptions.headers[ 'content-type' ] || ''))) {
                this.body = JSON.stringify(options.body);

            } else {
                this.body = qs_.stringify(options.body as ParsedUrlQueryInput);
                this.setContentType('application/x-www-form-urlencoded');
            }

            if (this.bodyCompress) {
                this.httpOptions.headers[ 'content-encoding' ] = 'gzip';

            } else {
                this.httpOptions.headers[ 'content-length' ] = Buffer.byteLength(this.body as string);
            }
        }

        const isHttps = (this.httpOptions.protocol === 'https:');
        this.requestModule = (isHttps) ? https_ : http_;

        if (options.agent) {
            if (is_plain_object(options.agent)) {
                const agentsCache = (isHttps) ? agentsCacheHttps : agentsCacheHttp;

                let agent = agentsCache.get(options.agent);
                if (!agent) {
                    agent = new this.requestModule.Agent(options.agent);
                    agentsCache.set(options.agent, agent);
                }
                this.httpOptions.agent = agent;

            } else {
                //  Здесь может быть либо `false`, либо `instanceof Agent`.
                //  Либо еще что-нибудь, инстанс какого-то левого агента типа TunnelingAgent.
                //
                this.httpOptions.agent = options.agent;
            }
        }

        if (this.httpOptions.protocol === 'https:') {
            this.httpOptions.pfx = options.pfx;
            this.httpOptions.key = options.key;
            this.httpOptions.passphrase = options.passphrase;
            this.httpOptions.cert = options.cert;
            this.httpOptions.ca = options.ca;
            this.httpOptions.ciphers = options.ciphers;
            this.httpOptions.rejectUnauthorized = options.rejectUnauthorized;
            this.httpOptions.secureProtocol = options.secureProtocol;
            this.httpOptions.servername = options.servername;
        }

        this.extra = options.extra;
    }

    setContentType(contentType: string) {
        if (this.httpOptions.headers && !this.httpOptions?.headers?.[ 'content-type' ]) {
            this.httpOptions.headers[ 'content-type' ] = contentType;
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

class DescriptRequest {

    options: RequestOptions;
    logger: Logger;
    cancel: Cancel;
    timestamps: EventTimestamps;
    hTimeout: number | null;
    req?: http.ClientRequest;
    isResolved: boolean;

    deferred: Deffered<DescriptHttpResult, DescriptError>;

    constructor(options: RequestOptions, logger: Logger, cancel: Cancel) {
        this.options = options;
        this.logger = logger;
        this.cancel = cancel;

        this.timestamps = {};
        this.hTimeout = null;

        this.isResolved = false;
    }

    start(): Promise<DescriptHttpResult> {
        this.log({
            type: EVENT.REQUEST_START,
            requestOptions: this.options,
        });

        this.timestamps.start = Date.now();

        this.deferred = getDeferred();

        this.cancel.subscribe((error) => this.doCancel(createError({
            id: ERROR_ID.HTTP_REQUEST_ABORTED,
            reason: error,
        })));
        this.setTimeout();

        try {
            this.req = this.options.requestModule.request(this.options.httpOptions, async(res) => {
                try {
                    const result = await this.requestHandler(res);
                    this.doDone(result);

                } catch (error) {
                    this.doFail(error);
                }
            });

            let onConnect: (() => void) | null = null;

            this.req.on('socket', (socket) => {
                this.timestamps.socket = Date.now();

                if (!socket.connecting) {
                    //  Это сокет из пула, на нем не будет события 'connect'.
                    this.timestamps.tcpConnection = this.timestamps.socket;

                } else {
                    onConnect = () => {
                        this.timestamps.tcpConnection = Date.now();
                    };

                    socket.once('connect', onConnect);
                }
            });

            this.req.on('error', (error) => {
                if (onConnect && this.req?.socket) {
                    this.req.socket.removeListener('connect', onConnect);

                    onConnect = null;
                }

                if (this.req?.aborted) {
                    //  FIXME: правда ли нет ситуация, когда это приведет к повисанию запроса?
                    return;
                }
                if (this.isResolved) {
                    return;
                }

                const reason = {
                    id: ERROR_ID.HTTP_UNKNOWN_ERROR,
                    message: error.message,
                };
                this.destroyRequestSocket();

                this.doFail(reason);
            });


            if (this.options.bodyCompress && this.options.body) {
                const gzipStream = createGzip(this.options.bodyCompress);
                gzipStream.pipe(this.req, { end: true });
                gzipStream.end(this.options.body, () => {
                    this.timestamps.body = Date.now();
                    this.timestamps.requestEnd = Date.now();
                });

            } else {
                if (this.options.body) {
                    this.req.write(this.options.body, () => {
                        this.timestamps.body = Date.now();
                    });
                }

                this.req.end(() => {
                    this.timestamps.requestEnd = Date.now();
                });
            }
        } catch (e) {
            this.doFail(e);
        }

        return this.deferred.promise;
    }

    doDone(result: DescriptHttpResult) {
        if (this.isResolved) {
            return;
        }

        this.clearTimeout();

        this.timestamps.end = this.timestamps.end || Date.now();

        this.log({
            type: EVENT.REQUEST_SUCCESS,
            requestOptions: this.options,
            result: result,
            timestamps: this.timestamps,
        });

        this.isResolved = true;

        this.deferred.resolve(result);
    }

    doFail(reason: Reason) {
        if (this.isResolved) {
            return;
        }

        this.clearTimeout();

        this.timestamps.end = this.timestamps.end || Date.now();

        const error = createError(reason);

        this.log({
            type: EVENT.REQUEST_ERROR,
            requestOptions: this.options,
            error: error,
            timestamps: this.timestamps,
        });

        this.isResolved = true;

        this.deferred.reject(error);
    }

    doCancel(error: Reason) {
        if (this.req) {
            this.req.abort();
        }

        this.doFail(error);
    }

    setTimeout() {
        if ((this.options.timeout || 0) > 0) {
            this.hTimeout = setTimeout(() => {
                let error;
                if (!this.timestamps.tcpConnection) {
                    //  Не смогли к этому моменту установить tcp-соединение.
                    error = ERROR_ID.TCP_CONNECTION_TIMEOUT;
                } else {
                    //  Тут просто слишком долго выполняли запрос целиком.
                    error = ERROR_ID.REQUEST_TIMEOUT;
                }

                this.doCancel(error);

            }, this.options.timeout) as unknown as number;
        }
    }

    clearTimeout() {
        if (this.hTimeout) {
            clearTimeout(this.hTimeout);
            this.hTimeout = null;
        }
    }

    destroyRequestSocket() {
        if (this.req && this.req.socket) {
            this.req.socket.destroy();
        }
    }

    async requestHandler(res: http.IncomingMessage): Promise<DescriptHttpResult> {
        res.once('readable', () => {
            this.timestamps.firstByte = Date.now();
        });

        const unzipped = decompressResponse(res);

        const buffers = [];
        let receivedLength = 0;

        //  NOTE: nodejs v15+
        //  [8a6fab02ad] - (SEMVER-MAJOR) http: emit 'error' on aborted server request (Robert Nagy) #33172
        //  https://github.com/nodejs/node/pull/33172
        try {
            for await (const chunk of unzipped) {
                this.cancel.throwIfCancelled();

                buffers.push(chunk);
                receivedLength += chunk.length;
            }
        } catch (error) {
            const isAborted = error.code === 'ECONNRESET';
            if (!isAborted) {
                throw error;
            }
        }

        if (!res.complete) {
            const error = createError(ERROR_ID.INCOMPLETE_RESPONSE);
            throw error;
        }

        const statusCode = res.statusCode as number;
        const body = (receivedLength) ? Buffer.concat(buffers, receivedLength) : null;
        const headers = res.headers;

        const error = createError({
            id: 'HTTP_' + statusCode,
            statusCode: statusCode,
            headers: headers,
            body: body,
            error: { message: http_.STATUS_CODES[ statusCode ] },
        });
        if (this.options.isError?.(error)) {
            throw error;
        }

        return {
            statusCode: statusCode,
            requestOptions: this.options,
            headers: headers,
            timestamps: this.timestamps,
            body: body,
        };
    }

    log(event: LoggerEvent) {
        if (this.logger) {
            event.request = this.req;
            this.logger.log(event);
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

async function request(options: DescriptRequestOptions, logger: Logger, cancel: Cancel): Promise<DescriptHttpResult> {
    const requestOptions = new RequestOptions(options);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const req = new DescriptRequest(requestOptions, logger, cancel);

        try {
            const result = await req.start();

            return result;

        } catch (error) {
            if (error.error.statusCode === 429 || error.error.statusCode >= 500) {
                //  Удаляем сокет, чтобы не залипать на отвечающем ошибкой бекэнде.
                req.destroyRequestSocket();
            }

            if (requestOptions.retries < requestOptions.maxRetries && requestOptions.isRetryAllowed?.(error, requestOptions)) {
                requestOptions.retries++;

                if (requestOptions.retryTimeout > 0) {
                    await waitFor(requestOptions.retryTimeout);
                }

            } else {
                throw error;
            }
        }
    }
}

request.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

function waitFor(timeout: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

class ZstdDecompress extends Transform {
    receivedLength: number;
    receivedChunks: Array<any>;

    constructor(options?: TransformOptions) {
        super(options);

        this.receivedChunks = [];
        this.receivedLength = 0;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this.receivedChunks.push(chunk);
        this.receivedLength += chunk.length;
        callback();
    }

    async _flush(callback: TransformCallback) {
        try {
            this.push(
                await decompress(Buffer.concat(this.receivedChunks, this.receivedLength)),
            );
            callback();
        } catch (e) {
            callback(e);
        }
    }
}

function decompressResponse(res: http.IncomingMessage) {
    const contentEncoding = res.headers[ 'content-encoding' ];

    if (contentEncoding === 'zstd') {
        return res.pipe(new ZstdDecompress());
    }

    if (contentEncoding === 'gzip' || contentEncoding === 'deflate') {
        return res.pipe(createUnzip());
    }

    return res;
}

//  ---------------------------------------------------------------------------------------------------------------  //

export default request;
