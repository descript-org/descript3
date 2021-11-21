type First< T > =
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? First : never;

type Tail< T > =
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? Rest : never;

type Equal< A, B > = A extends B ? ( B extends A ? A : never ) : never;

type UnionToIntersection< U > = ( U extends any ? ( k: U ) => void : never ) extends ( ( k: infer I ) => void ) ? I : never;

//  ---------------------------------------------------------------------------------------------------------------  //

import { OutgoingHttpHeaders } from 'http';
import {
    RequestOptions as HttpsRequestOptions,
    Agent as HttpsAgent,
    AgentOptions as HttpsAgentOptions,
} from 'https';

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptJSON =
    boolean |
    number |
    string |
    undefined |
    null |
    { [ property: string ]: DescriptJSON } |
    Array< DescriptJSON >;

//  ---------------------------------------------------------------------------------------------------------------  //

interface DescriptError {
    error: {
        id: string;
        message?: string;
        // для http-ошибок
        body?: Buffer | null;
        headers?: OutgoingHttpHeaders;
        status_code?: number;
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

declare class Cancel {
    cancel( reason: DescriptError ): void;
}

//  ---------------------------------------------------------------------------------------------------------------  //

declare class Cache< Result, Context > {
    get( args: { key: string, context: Context } ): Result | Promise< Result >;
    set( args: { key: string, value: Result, maxage: number, context: Context } ): void;
}

//  ---------------------------------------------------------------------------------------------------------------  //

interface DescriptRequestOptions {
    http_options: HttpsRequestOptions;
    body: string | Buffer | null;
    url: string;

    retries: number;

    extra?: {
        name: string;
    };
}

//  ---------------------------------------------------------------------------------------------------------------  //

interface DescriptHttpResult {
    status_code: number;
    headers: Record< string, string >;
    request_options: HttpsRequestOptions;
    body: Buffer;
}

interface LoggerEvent {
    type: Logger.EVENT;

    request_options: DescriptRequestOptions;

    timestamps: {
        start: number;
        socket: number;
        tcp_connection: number;
        end: number;
    };

    result?: DescriptHttpResult;

    error?: DescriptError;
}

interface DescriptLogger< Context > {
    log( event: LoggerEvent, context: Context ): void;
}

declare namespace Logger {
    export enum EVENT {
        REQUEST_START = 'REQUEST_START',
        REQUEST_SUCCESS = 'REQUEST_SUCCESS',
        REQUEST_ERROR = 'REQUEST_ERROR',
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptBlockId = symbol;
type DescriptBlockGenerateId = () => DescriptBlockId;

type DescriptBlockDeps = Record< DescriptBlockId, any >;

interface DescriptBlockOptions<
    Context,
    ParamsIn,
    ResultIn,
    ParamsOut = ParamsIn,
    ResultOut = ResultIn,
> {
    name?: string;

    id?: DescriptBlockId;
    deps?: DescriptBlockId | Array< DescriptBlockId >;

    params?: ( args: {
        params: ParamsIn,
        context: Context,
        deps: DescriptBlockDeps,
    } ) => ParamsOut;

    before?: ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
        cancel: Cancel,
    } ) => ResultOut | Promise< ResultOut > | void;

    after?: ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
        cancel: Cancel,
        result: ResultIn,
    } ) => ResultOut | Promise< ResultOut >;

    error?: ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
        cancel: Cancel,
        error: DescriptError,
    } ) => ResultOut | void;

    timeout?: number;

    key?: string | ( ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
    } ) => string );
    maxage?: number;
    cache?: Cache< ResultOut, Context >;

    required?: boolean;

    logger?: DescriptLogger< Context >;
}

//  ---------------------------------------------------------------------------------------------------------------  //
//  HttpBlock

type DescriptHttpBlockDescriptionCallback< T, Params, Context > = T | ( ( args: {
    params: Params,
    context: Context,
    deps: DescriptBlockDeps,
 } ) => T );

type DescriptHttpBlockQueryValue = string | number | boolean;
type DescriptHttpBlockQuery = Record< string, DescriptHttpBlockQueryValue >;

type DescriptHttpBlockHeaders = Record< string, string >;

interface DescriptHttpBlockDescription< Params, Context > {
    protocol?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    hostname?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    port?: DescriptHttpBlockDescriptionCallback< number, Params, Context >;
    method?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    pathname?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;

    query?:
        Record< string,
            DescriptHttpBlockQueryValue |
            null |
            ( ( args: {
                params: Params,
                context: Context,
                deps: DescriptBlockDeps,
                query: DescriptHttpBlockQuery,
            } ) => DescriptHttpBlockQueryValue )
        > |
        (
            ( args: {
                params: Params,
                context: Context,
                deps: DescriptBlockDeps,
                query: DescriptHttpBlockQuery,
            } ) => DescriptHttpBlockQuery
        );

    headers?:
        Record< string,
            string |
            ( ( args: {
                params: Params,
                context: Context,
                deps: DescriptBlockDeps,
                headers: DescriptHttpBlockHeaders,
            } ) => string )
        > |
        (
            ( args: {
                params: Params,
                context: Context,
                deps: DescriptBlockDeps,
                headers: DescriptHttpBlockHeaders,
            } ) => DescriptHttpBlockHeaders
        );

    body?:
        string |
        Buffer |
        ( ( args: {
            params: Params,
            context: Context,
            deps: DescriptBlockDeps,
        } ) => string | Buffer | DescriptJSON );

    is_json?: boolean;

    timeout?: number;

    is_error?: ( error: DescriptError, request_options: DescriptRequestOptions ) => boolean;

    is_retry_allowed?: ( error: DescriptError, request_options: DescriptRequestOptions ) => boolean;
    max_retries?: number;
    retry_timeout?: number;

    prepare_request_options?: ( options: HttpsRequestOptions ) => HttpsRequestOptions;
    parse_body?: (result: { headers: Record< string, string >; body?: Buffer }, context: Context) => {};

    family?: DescriptHttpBlockDescriptionCallback< number, Params, Context >;

    agent?: HttpsAgent | HttpsAgentOptions | false;

    auth?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;

    ca?: DescriptHttpBlockDescriptionCallback< string | Buffer, Params, Context >;
    cert?: DescriptHttpBlockDescriptionCallback< string | Buffer, Params, Context >;
    ciphers?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    key?: DescriptHttpBlockDescriptionCallback< string | Buffer, Params, Context >;
    passphrase?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    pfx?: DescriptHttpBlockDescriptionCallback< string | Buffer, Params, Context >;
    rejectUnauthorized?: DescriptHttpBlockDescriptionCallback< boolean, Params, Context >;
    secureProtocol?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
    servername?: DescriptHttpBlockDescriptionCallback< string, Params, Context >;
}

interface DescriptHttpBlock<
    Context,
    Params,
    Result,
> {
    < ExtendedParamsIn = Params, ExtendedResultOut = Result>( args: {
        block?: DescriptHttpBlockDescription< Params, Context >,
        options?: DescriptBlockOptions< Context, ExtendedParamsIn, Result, Params, ExtendedResultOut >,
    } ): DescriptHttpBlock< Context, ExtendedParamsIn, ExtendedResultOut >;
}

declare function http<
    Context,
    ParamsIn,
    ResultIn,
    ParamsOut = ParamsIn,
    ResultOut = ResultIn,
> (
    args: {
        block: DescriptHttpBlockDescription< ParamsOut, Context >,
        options?: DescriptBlockOptions< Context, ParamsIn, ResultIn, ParamsOut, ResultOut >,
    },
): DescriptHttpBlock< Context, ParamsIn, ResultOut >;

//  ---------------------------------------------------------------------------------------------------------------  //
//  FuncBlock

type DescriptFuncBlockDescription<
    Context,
    Params,
    Result,
> = ( args: {
    params: Params,
    context: Context,
    deps: DescriptBlockDeps,
    generate_id: DescriptBlockGenerateId,
    cancel: Cancel,
} ) =>
    Result |
    Promise< Result >;
    //  DescriptBlock< Context, Params, Result > |

interface DescriptFuncBlock<
    Context,
    Params,
    Result,
> {
    < ExtendedParamsIn, ExtendedResultOut >( args: {
        block?: DescriptFuncBlockDescription< Context, Params, Result >,
        options?: DescriptBlockOptions< Context, ExtendedParamsIn, Result, Params, ExtendedResultOut >,
    } ): DescriptFuncBlock< Context, ExtendedParamsIn, ExtendedResultOut >;
}

declare function func<
    Context,
    ParamsIn,
    ResultIn,
    ParamsOut = ParamsIn,
    ResultOut = ResultIn,
> (
    args: {
        block: DescriptFuncBlockDescription< Context, ParamsOut, ResultIn >,
        options?: DescriptBlockOptions< Context, ParamsIn, ResultIn, ParamsOut, ResultOut >,
    },
): DescriptFuncBlock< Context, ParamsIn, ResultOut >;

//  ---------------------------------------------------------------------------------------------------------------  //
//  ArrayBlock

type GetArrayBlockResult< T > = {
    0: never,
    1: [ GetDescriptBlockResult< First< T > > ],
    2: [ GetDescriptBlockResult< First< T > >,  ...GetArrayBlockResult< Tail< T > > ],
}[ T extends [] ? 0 : T extends ( ( readonly [ any ] ) | [ any ] ) ? 1 : 2 ];

type GetArrayBlockParams< T > = {
    0: never,
    1: GetDescriptBlockParams< First< T > >,
    2: GetDescriptBlockParams< First< T > > & GetArrayBlockParams< Tail< T > >,
}[ T extends [] ? 0 : T extends ( ( readonly [ any ] ) | [ any ] ) ? 1 : 2 ];

type GetArrayBlockContext< T > = {
    0: never,
    1: GetDescriptBlockContext< First< T > >,
    2: Equal< GetDescriptBlockContext< First< T > >, GetArrayBlockContext< Tail< T > > >,
}[ T extends [] ? 0 : T extends ( ( readonly [ any ] ) | [ any ] ) ? 1 : 2 ];

type DescriptArrayBlockDescription< T extends ReadonlyArray< any > | Array< any > > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer Result > ? T[ P ] : never
}

interface DescriptArrayBlock<
    Context,
    Params,
    Result,
> {
    < ExtendedParamsIn = Params, ExtendedResultOut = Result >( args: {
        options?: DescriptBlockOptions< Context, ExtendedParamsIn, Result, Params, ExtendedResultOut >,
    } ): DescriptArrayBlock< Context, ExtendedParamsIn, ExtendedResultOut >;
}

declare function array<
    Block extends ReadonlyArray< any >,
    Context = GetArrayBlockContext< Block >,
    ParamsIn = GetArrayBlockParams< Block >,
    ResultIn = GetArrayBlockResult< Block >,
    ParamsOut = ParamsIn,
    ResultOut = ResultIn,
> (
    args: {
        block: DescriptArrayBlockDescription< Block >,
        options?: DescriptBlockOptions<
            Context,
            ParamsIn,
            ResultIn,
            ParamsOut,
            ResultOut
        >,
    },
): DescriptArrayBlock< Context, ParamsIn, ResultOut >;

//  ---------------------------------------------------------------------------------------------------------------  //
//  ObjectBlock

type GetObjectBlockResult< T > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer Result > ? Result : never;
}

type GetObjectBlockParamsMap< T extends {} > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer Result > ? Params : never;
}
type GetObjectBlockParams< T extends {}, M = GetObjectBlockParamsMap< T > > = UnionToIntersection< M[ keyof M ] >;

type GetObjectBlockContextMap< T extends {} > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer Result > ? Context : never;
}
//  Тут не совсем правда, но лучше пока непонятно как сделать.
type GetObjectBlockContext< T extends {}, M = GetObjectBlockContextMap< T > > = UnionToIntersection< M[ keyof M ] >;

type DescriptObjectBlockDescription< T extends {} > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer Result > ? T[ P ] : never
}

interface DescriptObjectBlock<
    Context,
    Params,
    Result,
> {
    < ExtendedParamsIn = Params, ExtendedResultOut = Result >( args: {
        options?: DescriptBlockOptions< Context, ExtendedParamsIn, Result, Params, ExtendedResultOut >,
    } ): DescriptObjectBlock< Context, ExtendedParamsIn, ExtendedResultOut >;
}

declare function object<
    Block extends {},
    Context = GetObjectBlockContext< Block >,
    ParamsIn = GetObjectBlockParams< Block >,
    ResultIn = GetObjectBlockResult< Block >,
    ParamsOut = ParamsIn,
    ResultOut = ResultIn,
> (
    args: {
        block: DescriptObjectBlockDescription< Block >,
        options?: DescriptBlockOptions<
            Context,
            ParamsIn,
            ResultIn,
            ParamsOut,
            ResultOut
        >,
    },
): DescriptObjectBlock< Context, ParamsIn, ResultOut >;

//  ---------------------------------------------------------------------------------------------------------------  //
/*
//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptPipeBlockDescription = Array< DescriptBlock >;

interface DescriptPipeBlock {
    ( args: { block?: DescriptPipeBlockDescription, options?: DescriptBlockOptions } ): DescriptPipeBlock;
}

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptFirstBlockDescription = Array< DescriptBlock >;

interface DescriptFirstBlock {
    ( args: { block?: DescriptFirstBlockDescription, options?: DescriptBlockOptions } ): DescriptFirstBlock;
}

//  ---------------------------------------------------------------------------------------------------------------  //

*/

type DescriptBlock< Context, Params, Result > =
    DescriptHttpBlock< Context, Params, Result > |
    DescriptFuncBlock< Context, Params, Result > |
    DescriptArrayBlock< Context, Params, Result > |
    DescriptObjectBlock< Context, Params, Result >;

//  ---------------------------------------------------------------------------------------------------------------  //

export type GetDescriptBlockResult< T > =
    T extends DescriptBlock< infer Context, infer Params, infer Result > ? Result : never;

export type GetDescriptBlockParams< T > =
    T extends DescriptBlock< infer Context, infer Params, infer Result > ? Params : never;

export type GetDescriptBlockContext< T > =
    T extends DescriptBlock< infer Context, infer Params, infer Result > ? Context : never;

//  ---------------------------------------------------------------------------------------------------------------  //

declare function run<
    Context,
    Params,
    Result,
> (
    block: DescriptBlock< Context, Params, Result >,
    args: {
        params?: Params,
        context?: Context,
    },
): Promise< Result >;

//  ---------------------------------------------------------------------------------------------------------------  //

declare function is_block( block: any ): boolean;

//  ---------------------------------------------------------------------------------------------------------------  //

declare function error( error: { id: string; [ key: string ]: any } ): DescriptError;
declare function is_error( error: any ): error is DescriptError;

declare enum ERROR_ID {
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
}

//  ---------------------------------------------------------------------------------------------------------------  //

declare namespace request {
    interface DefaultOptions {
        is_error: ( error: DescriptError, request_options: DescriptRequestOptions ) => boolean,
        is_retry_allowed: ( error: DescriptError, request_options: DescriptRequestOptions ) => boolean,
    }

    export const DEFAULT_OPTIONS: DefaultOptions;
}
