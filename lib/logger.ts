import type { DescriptHttpResult } from './types';
import type { RequestOptions } from './request';
import type { DescriptError } from './error';
import type http from 'node:http';

type Config = {
    debug?: boolean;
}

export enum EVENT {
    REQUEST_START= 'REQUEST_START',
    REQUEST_SUCCESS = 'REQUEST_SUCCESS',
    REQUEST_ERROR = 'REQUEST_ERROR',
}

export type EventTimestamps = {
    start?: number;
    socket?: number;
    tcpConnection?: number;
    firstByte?: number;
    body?: number;
    requestEnd?: number;
    end?: number;
};

interface BaseLoggerEvent {
    requestOptions: RequestOptions;

    timestamps?: EventTimestamps;

    request?: http.ClientRequest;

}

interface SuccessLoggerEvent extends BaseLoggerEvent {
    type: EVENT.REQUEST_SUCCESS;
    result: DescriptHttpResult;
}


interface ErrorLoggerEvent extends BaseLoggerEvent {
    type: EVENT.REQUEST_ERROR;
    error: DescriptError;
}

interface StartLoggerEvent extends BaseLoggerEvent {
    type: EVENT.REQUEST_START;
}

export type LoggerEvent = SuccessLoggerEvent | ErrorLoggerEvent | StartLoggerEvent;


class Logger {
    private _debug = false;

    constructor(config: Config) {
        config = config || {};

        this._debug = config.debug || false;
    }

    log(event: LoggerEvent) {
        switch (event.type) {
            case EVENT.REQUEST_START: {
                if (this._debug) {
                    const message = `[DEBUG] ${ event.requestOptions.httpOptions.method } ${ event.requestOptions.url }`;

                    logToStream(process.stdout, message);
                }

                break;
            }

            case EVENT.REQUEST_SUCCESS: {
                let message = `${ event.result.statusCode } ${ total(event) } ${ event.requestOptions.httpOptions.method } ${ event.requestOptions.url }`;
                const body = event.requestOptions.body;
                if (body) {
                    if (Buffer.isBuffer(body)) {
                        message += ' ' + String(body);

                    } else {
                        message += ' ' + body;
                    }
                }

                logToStream(process.stdout, message);

                break;
            }

            case EVENT.REQUEST_ERROR: {
                const error = event.error.error;

                let message = '[ERROR] ';
                if ((error.statusCode || 0) > 0) {
                    message += error.statusCode;

                } else {
                    if (error.stack) {
                        message += ' ' + error.stack;

                    } else {
                        message += error.id;
                        if (error.message) {
                            message += ': ' + error.message;
                        }
                    }
                }
                message += ` ${ total(event) } ${ event.requestOptions.httpOptions.method } ${ event.requestOptions.url }`;

                logToStream(process.stderr, message);

                break;
            }
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //


//  ---------------------------------------------------------------------------------------------------------------  //

function logToStream(stream: typeof process.stderr | typeof process.stdout, message: string) {
    const date = new Date().toISOString();

    stream.write(`${ date } ${ message }\n`);
}

function total(event: LoggerEvent) {
    let total = `${ (event.timestamps?.end || 0) - (event.timestamps?.start || 0) }ms`;

    const retries = event.requestOptions.retries;
    if (retries > 0) {
        total += ` (retry #${ retries })`;
    }

    return total;
}

export default Logger;
