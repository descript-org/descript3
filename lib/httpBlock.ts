import Block from './block' ;
import { ERROR_ID, createError } from './error' ;

import type { DescriptRequestOptions } from './request';
import request from './request' ;

import extend from './extend' ;
import extendOption from './extendOption' ;
import stripNullAndUndefinedValues from './stripNullAndUndefinedValues' ;
import type { DescriptBlockDeps } from './depsDomain';
import type { BlockResultOut, DescriptHttpBlockResult, DescriptBlockOptions, DescriptHttpResult, DescriptHttpBlockHeaders, DescriptJSON } from './types';
import type ContextClass from './context';
import type Cancel from './cancel';
import type DepsDomain from './depsDomain';
import type Logger from './logger';

//  ---------------------------------------------------------------------------------------------------------------  //

const rxIsJson = /^application\/json(?:;|\s|$)/;

type DescriptHttpBlockDescriptionCallback< T, Params, Context > = T | ((args: {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
}) => T);

export type DescriptHttpBlockQueryValue = string | number | boolean | undefined | null | Array<string | number | boolean | object>;
export type DescriptHttpBlockQuery = Record< string, DescriptHttpBlockQueryValue >;

type HttpQuery<Params, Context> = Record<
string,
DescriptHttpBlockQueryValue |
((args: {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
    query: DescriptHttpBlockQuery;
}) => DescriptHttpBlockQueryValue)
> |
(
    (args: {
        params: Params;
        context: Context;
        deps: DescriptBlockDeps;
        query: DescriptHttpBlockQuery;
    }) => DescriptHttpBlockQuery
);

export type HttpHeaders<Params, Context> = Record< string,
string |
((args: {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
    headers: DescriptHttpBlockHeaders;
}) => string)
> |
(
    (args: {
        params: Params;
        context: Context;
        deps: DescriptBlockDeps;
        headers: DescriptHttpBlockHeaders;
    }) => DescriptHttpBlockHeaders
);

type HttpBody<Params, Context> = string |
Buffer |
DescriptJSON |
((args: {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
}) => string | Buffer | DescriptJSON);

export interface DescriptHttpBlockDescription<
    Params,
    Context,
    HTTPResult
> extends Pick<
    DescriptRequestOptions,
    'bodyCompress' | 'timeout' | 'isError' | 'isRetryAllowed' | 'maxRetries' | 'retryTimeout' | 'agent' |
    'auth' | 'ca' | 'cert' | 'ciphers' | 'key' | 'passphrase' | 'pfx' | 'rejectUnauthorized' | 'secureProtocol' | 'servername'
    > {
    protocol?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    hostname?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    port?: DescriptHttpBlockDescriptionCallback< number, Params, Context >;
    method?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    pathname?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;

    family?: DescriptHttpBlockDescriptionCallback< number, Params, Context >;

    query?: HttpQuery<Params, Context> | Array<HttpQuery<Params, Context>>;

    headers?: HttpHeaders<Params, Context> | Array<HttpHeaders<Params, Context>>;


    body?: HttpBody<Params, Context>;

    isJson?: boolean;

    prepareRequestOptions?: (options: DescriptRequestOptions) => DescriptRequestOptions;

    parseBody?: (result: {body: DescriptHttpResult['body']; headers: DescriptHttpResult['headers']}, context: Context) =>
    HTTPResult;

}

const EVALUABLE_PROPS: Array<keyof Pick<DescriptRequestOptions, 'agent' |
'auth' |
'bodyCompress' |
'ca' |
'cert' |
'ciphers' |
'family' |
'hostname' |
'key' |
'maxRetries' |
'method' |
'passphrase' |
'pathname' |
'pfx' |
'port' |
'protocol' |
'rejectUnauthorized' |
'secureProtocol' |
'servername' |
'timeout'>> = [
    'agent',
    'auth',
    'bodyCompress',
    'ca',
    'cert',
    'ciphers',
    'family',
    'hostname',
    'key',
    'maxRetries',
    'method',
    'passphrase',
    'pathname',
    'pfx',
    'port',
    'protocol',
    'rejectUnauthorized',
    'secureProtocol',
    'servername',
    'timeout',
];

type CallbackArgs<Params, Context> = {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
}

//  ---------------------------------------------------------------------------------------------------------------  //

class HttpBlock<
    Context,
    ParamsOut,
    HttpResult,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    BlockResult = DescriptHttpBlockResult<HttpResult>,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = ParamsOut
> extends Block<
    Context,
    DescriptHttpBlockDescription<ParamsOut, Context, HttpResult>,
    ParamsOut,
    ResultOut,
    HttpResult,
    BlockResult,
    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params
    > {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment

    extend<
        ExtendedResultOut extends BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //ExtendedCustomBlock = DescriptHttpBlockDescription<ExtendedParamsOut, Context, HttpResult>,

        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
    >({ options, block }: {
        block?: DescriptHttpBlockDescription<ParamsOut & ExtendedParamsOut, Context, HttpResult>;
        options?: DescriptBlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >;
    }) {
        const x = new HttpBlock<
        Context,
        ExtendedParamsOut,
        HttpResult,
        ExtendedResultOut,
        ExtendedBlockResult,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut,
        ExtendedParams
        >({
            block: this.extendBlock(block),
            options: this.extendOptions(this.options, options),
        });

        return x;
    }

    protected logger: Logger<Context>;

    constructor({ block, options }: {
        block?: DescriptHttpBlockDescription<ParamsOut, Context, HttpResult>;

        options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;

    }) {
        super({ block, options });

        if (options && options.logger) {
            this.logger = options.logger;
        }
    }

    protected initBlock(block: DescriptHttpBlockDescription<ParamsOut, Context, HttpResult>) {
        super.initBlock(block);

        //  this._compiled_props = compile_props( this.block );
    }

    protected extendBlock(by: DescriptHttpBlockDescription<any, Context, HttpResult> = {}) {
        const what = this.block;
        const headers = extendOption(what.headers, by.headers);
        const query = extendOption(what.query, by.query);

        const block = extend({}, what, by);

        if (headers) {
            block.headers = headers;
        }
        if (query) {
            block.query = query;
        }

        return block;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async blockAction({ runContext, blockCancel, cancel, params, context, deps, nParents, depsDomain }: {
        runContext: ContextClass<BlockResult, HttpResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        const block = this.block;

        const callbackArgs: CallbackArgs<ParamsOut, Context> = { params, context, deps };

        let options: DescriptRequestOptions = {
            isError: block.isError,
            isRetryAllowed: block.isRetryAllowed,
            retryTimeout: block.retryTimeout,
            body: null,
            ...(
                EVALUABLE_PROPS.reduce((ret, prop) => {
                    let value = block[prop];

                    if (typeof value === 'function') {
                        value = value(callbackArgs);
                    }

                    if (value !== null) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ret[ prop ] = value;
                    }

                    return ret;
                }, {} as {
                    [P in typeof EVALUABLE_PROPS extends Array<infer K> ? K : never]:
                    DescriptRequestOptions[P] extends undefined ? never : DescriptRequestOptions[P]
                })
            ),
        };


        //  TODO: Надо пострелять, чтобы понять, стоит ли городить эту оптимизацию.
        //  Блоки часто будут создаваться динамически, внутри замыкания с generate_id,
        //  так что стоимость компиляции может быть больше, чем просто тупой цикл.
        //
        //  this._compiled_props( options, callbackArgs );

        if (options.method) {
            options.method = options.method.toUpperCase();
        }

        if (block.headers) {
            options.headers = evalHeaders(block.headers, callbackArgs);
        }

        if (block.query) {
            options.query = evalQuery(block.query, callbackArgs);
        }

        if (block.body !== undefined) {
            options.body = evalBody(block.body, callbackArgs);
        }

        if (this.options.name) {
            options.extra = {
                name: this.options.name,
            };
        }

        if (typeof block.prepareRequestOptions === 'function') {
            options = block.prepareRequestOptions(options);
        }

        let result: DescriptHttpResult | undefined = undefined;
        let headers;
        let error;

        try {
            result = await request(options, this.logger, context, blockCancel);
            headers = result.headers;

        } catch (e) {
            error = e.error;
            headers = error.headers;
        }

        if (error || !result) {
            if (error.body) {
                const result = { body: error.body, headers: headers };
                if (typeof block.parseBody === 'function') {
                    try {
                        error.body = block.parseBody(result, context);

                    } catch (e) {
                        //  Do nothing
                    }

                } else {
                    error.body = this.parseErrorBody(result);
                }
            }

            throw createError(error);
        }

        let body: HttpResult | null = null;
        if (typeof block.parseBody === 'function') {
            try {
                body = block.parseBody(result!, context);

            } catch (e) {
                throw createError(e, ERROR_ID.PARSE_BODY_ERROR);
            }

        } else if (result.body) {
            body = this.parseBody(result);
        }

        const blockResult = {
            statusCode: result.statusCode,
            headers: result.headers,
            requestOptions: result.requestOptions,
            result: body,
            toJSON() {
                // stringify serializable fields only,
                // usefully for remote cache storage
                return {
                    statusCode: this.statusCode,
                    headers: this.headers,
                    result: this.result,
                };
            },
        };

        return blockResult as BlockResult;
    }

    protected parseBody({ body, headers }: {body: DescriptHttpResult['body']; headers: DescriptHttpResult['headers']}): HttpResult {
        const isJson = this.isJsonResponse(headers);
        if (isJson) {
            try {
                return JSON.parse(body as unknown as string);

            } catch (e) {
                throw createError(e, ERROR_ID.INVALID_JSON);
            }
        }

        return String(body) as HttpResult;
    }

    protected parseErrorBody({ body, headers }: { body: string | Buffer; headers: DescriptHttpBlockHeaders }) {
        const isJson = this.isJsonResponse(headers);
        if (isJson) {
            try {
                return JSON.parse(body.toString());

            } catch (e) {
                //  Do nothing.
            }
        }

        if (Buffer.isBuffer(body)) {
            return body.toString();
        }

        return body;
    }

    private isJsonResponse(headers: DescriptHttpBlockHeaders) {
        let isJson = this.block.isJson;
        if (!isJson && headers) {
            const contentType = headers[ 'content-type' ];

            if (contentType) {
                isJson = rxIsJson.test(contentType);
            }
        }

        return isJson;
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

export default HttpBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

function evalHeaders<Params, Context>(
    objects: HttpHeaders<Params, Context> | Array<HttpHeaders<Params, Context>>,
    callbackArgs: CallbackArgs<Params, Context>,
) {
    let headers = {};

    if (Array.isArray(objects)) {
        objects.forEach((object) => {
            headers = evalHeadersObject(headers, object, callbackArgs);
        });

    } else {
        headers = evalHeadersObject(headers, objects, callbackArgs);
    }

    return headers;
}

function evalHeadersObject<Params, Context>(
    headers: DescriptHttpBlockHeaders,
    object: HttpHeaders<Params, Context>,
    callbackArgs: CallbackArgs<Params, Context>,
) {
    const extendedCallbackArgs = { ...callbackArgs, headers };

    if (typeof object === 'function') {
        const newHeaders = object(extendedCallbackArgs);
        if (newHeaders && typeof newHeaders === 'object') {
            headers = newHeaders;
        }

    } else {
        headers = {};

        for (const key in object) {
            const value = object[ key ];
            headers[ key ] = (typeof value === 'function') ? value(extendedCallbackArgs) : value;
        }
    }

    return headers;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function evalQuery<Params, Context>(
    objects: HttpQuery<Params, Context> | Array<HttpQuery<Params, Context>>,
    callbackArgs: CallbackArgs<Params, Context>,
) {
    let query = {};

    if (Array.isArray(objects)) {
        objects.forEach((object) => {
            query = evalQueryObject(query, object, callbackArgs);
        });

    } else {
        query = evalQueryObject(query, objects, callbackArgs);
    }

    return query;
}

function evalQueryObject<Params, Context>(
    query: DescriptHttpBlockQuery,
    object: HttpQuery<Params, Context>,
    callbackArgs: CallbackArgs<Params, Context>,
) {
    const params = callbackArgs.params;

    const extendedCallbackArgs = { ...callbackArgs, query };

    if (typeof object === 'function') {
        const newQuery = object(extendedCallbackArgs);
        if (newQuery && typeof newQuery === 'object') {
            query = stripNullAndUndefinedValues(newQuery);
        }

    } else {
        query = {};

        for (const key in object) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const pValue = params[ key ];
            const oValue = object[ key ];

            let value;
            if (oValue === null) {
                value = pValue;

            } else if (typeof oValue === 'function') {
                value = oValue(extendedCallbackArgs);

            } else if (oValue !== undefined) {
                value = (pValue === undefined) ? oValue : pValue;
            }

            if (value !== undefined) {
                query[ key ] = value;
            }
        }
    }

    return query;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function evalBody<Params, Context>(body: HttpBody<Params, Context>, callbackArgs: CallbackArgs<Params, Context>) {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
        return body;
    }

    if (typeof body === 'function') {
        return body(callbackArgs);
    }

    return String(body);
}

/*
function compile_props( block ) {
    let js = 'var v;';
    PROPS.forEach( ( prop ) => {
        const value = block[ prop ];
        if ( value != null ) {
            if ( typeof value === 'function' ) {
                js += `v=b["${ prop }"](a);`;
                js += `if (v!=null){o["${ prop }"]=v}`;

            } else {
                js += `o["${ prop }"]=b["${ prop }"];`;
            }
        }
    } );

    const compiled = Function( 'b', 'o', 'a', js );

    return function( options, callbackArgs ) {
        return compiled( block, options, callbackArgs );
    };
}
*/
