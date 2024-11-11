import type { OutgoingHttpHeaders } from 'http';

type ArbitraryObject = { [key: string]: unknown };

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
    return isArbitraryObject(error) &&
        error instanceof Error &&
        (typeof error.errno === 'number' || typeof error.errno === 'undefined') &&
        (typeof error.code === 'string' || typeof error.code === 'undefined') &&
        (typeof error.path === 'string' || typeof error.path === 'undefined') &&
        (typeof error.syscall === 'string' || typeof error.syscall === 'undefined');
}

function isArbitraryObject(potentialObject: unknown): potentialObject is ArbitraryObject {
    return typeof potentialObject === 'object' && potentialObject !== null;
}

export enum ERROR_ID {
    ALL_BLOCKS_FAILED = 'ALL_BLOCKS_FAILED',
    BLOCK_TIMED_OUT = 'BLOCK_TIMED_OUT',
    DEPS_ERROR = 'DEPS_ERROR',
    DEPS_NOT_RESOLVED = 'DEPS_NOT_RESOLVED',
    HTTP_REQUEST_ABORTED = 'HTTP_REQUEST_ABORTED',
    HTTP_UNKNOWN_ERROR = 'HTTP_UNKNOWN_ERROR',
    INCOMPLETE_RESPONSE = 'INCOMPLETE_RESPONSE',
    INVALID_BLOCK = 'INVALID_BLOCK',
    INVALID_DEPS_ID = 'INVALID_DEPS_ID',
    INVALID_JSON = 'INVALID_JSON',
    INVALID_OPTIONS_PARAMS = 'INVALID_OPTIONS_PARAMS',
    PARSE_BODY_ERROR = 'PARSE_BODY_ERROR',
    REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
    REQUIRED_BLOCK_FAILED = 'REQUIRED_BLOCK_FAILED',
    TCP_CONNECTION_TIMEOUT = 'TCP_CONNECTION_TIMEOUT',
    TOO_MANY_AFTERS_OR_ERRORS = 'TOO_MANY_AFTERS_OR_ERRORS',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    JS_ERROR = 'JS_ERROR',
}

export interface ErrorData<Error = Buffer | null | unknown> {
    id?: string | ERROR_ID;
    message?: string;
    // для http-ошибок
    body?: Error;
    headers?: OutgoingHttpHeaders;
    statusCode?: number;

    location?: string;

    errno?: number | undefined;
    code?: string | undefined;
    path?: string | undefined;
    syscall?: string | undefined;

    stack?: string;
    error?: any;
    reason?: Reason | Array<Reason>;
}


export type IncomingError = NodeJS.ErrnoException | Error | (ErrorData & {name?: string}) | string

export class DescriptError {
    error: ErrorData;
    constructor(error: IncomingError, id?: ERROR_ID) {
        if (typeof error === 'string') {
            if (!id) {
                this.error = {
                    id: error,
                    message: '',
                };
            } else {
                this.error = {
                    id: id,
                    message: error,
                };
            }
        } else if (error instanceof Error) {
            const _error: ErrorData = {
                id: id || error.name || ERROR_ID.JS_ERROR,
                message: error.message,
                stack: error.stack,
            };

            if (isErrnoException(error)) {
                if (error.errno) {
                    _error.errno = error.errno;
                }
                if (error.code) {
                    _error.code = error.code;
                }
                if (error.syscall) {
                    _error.syscall = error.syscall;
                }
            }

            this.error = _error;
        } else {
            const _error: ErrorData = {
                id: id || error.name || error.id,
                body: error.body,
                headers: error.headers,
                statusCode: error.statusCode,
                error: error.error,
                reason: error.reason,
                path: error.path,
                code: error.code,
                message: error.message || error.error?.message,
                stack: error.stack,
                errno: error.errno,
                syscall: error.syscall,
                location: error.location,
            };

            this.error = _error;
        }

        if (!error) {
            this.error = {
                id: ERROR_ID.UNKNOWN_ERROR,
                message: '',
            };
        }

        if (this.error?.id === 'Error') {
            this.error.id = ERROR_ID.UNKNOWN_ERROR;
        }

        if (!this.error?.id) {
            this.error.id = ERROR_ID.UNKNOWN_ERROR;
        }

        this.error = Object.keys(this.error).reduce((acc, key) => {
            if ((this.error as any)[key] !== undefined) {
                (acc as any)[key] = (this.error as any)[key];
            }

            return acc;
        }, {} as ErrorData);
    }
}

export type Reason = DescriptError | string | ERROR_ID | IncomingError;

export function createError(error: Reason, id?: ERROR_ID): DescriptError {
    if (isError(error, id)) {
        return error;
    }

    return new DescriptError(error, id);
}

export function isError(error: any, id?: ERROR_ID): error is DescriptError {
    if (error instanceof DescriptError) {
        if (id) {
            return (error.error.id === id);
        }

        return true;
    }

    return false;
}

//  ---------------------------------------------------------------------------------------------------------------  //
