export type First< T > =
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? First : never;

export type Tail< T > =
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? Rest : never;

type Equal< A, B > = A extends B ? ( B extends A ? A : never ) : never;

//  ---------------------------------------------------------------------------------------------------------------  //

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

interface LoggerEvent {
    type: Logger.EVENT;

    request_options: DescriptRequestOptions;

    timestamps: {
        start: number;
        socket: number;
        tcp_connection: number;
        end: number;
    };

    result?: {
        status_code: number;
        headers: Record< string, string >;
        request_options: HttpsRequestOptions;
        body: Buffer;
    };

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

/*
type DescriptBlockResult<
    Params,
    Context,
    Result,
> =
    Result |
    Promise< Result >;
    //  DescriptBlock< Params, Context, Result > |
    //  Promise< DescriptBlockResult< Params, Context, Result > >;
*/

interface DescriptBlockBaseCallbackArgs<
    Params,
    Context,
> {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
}

interface DescriptBlockOptions<
    ParamsIn,
    ParamsOut,
    Context,
    ResultIn,
    ResultOut,
> {
    name?: string;

    id?: DescriptBlockId;
    deps?: DescriptBlockId | Array< DescriptBlockId >;

    params?: ( args: DescriptBlockBaseCallbackArgs< ParamsIn, Context > ) => ParamsOut;

    before?: ( args: DescriptBlockBaseCallbackArgs< ParamsOut, Context > & {
        cancel: Cancel,
    } ) => ResultOut | void;

    after?: ( args: DescriptBlockBaseCallbackArgs< ParamsOut, Context > & {
        cancel: Cancel,
        result: ResultIn,
    } ) => ResultOut;

    error?: ( args: DescriptBlockBaseCallbackArgs< ParamsOut, Context > & {
        cancel: Cancel,
        error: DescriptError,
    } ) => ResultOut | void;

    timeout?: number;

    key?: string | ( ( args: DescriptBlockBaseCallbackArgs< ParamsOut, Context > ) => string );
    maxage?: number;
    cache?: Cache< ResultOut, Context >;

    required?: boolean;

    logger?: DescriptLogger< Context >;
}

//  ---------------------------------------------------------------------------------------------------------------  //
//  HttpBlock

type DescriptHttpBlockDescriptionCallback< T, Params, Context > = T | ( ( args: DescriptBlockBaseCallbackArgs< Params, Context > ) => T );

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
            ( ( args: DescriptBlockBaseCallbackArgs< Params, Context > & {
                query: DescriptHttpBlockQuery,
            } ) => DescriptHttpBlockQueryValue )
        > |
        (
            ( args: DescriptBlockBaseCallbackArgs< Params, Context > & {
                query: DescriptHttpBlockQuery,
            } ) => DescriptHttpBlockQuery
        );

    headers?:
        Record< string,
            string |
            ( ( args: DescriptBlockBaseCallbackArgs< Params, Context > & {
                headers: DescriptHttpBlockHeaders,
            } ) => string )
        > |
        (
            ( args: DescriptBlockBaseCallbackArgs< Params, Context > & {
                headers: DescriptHttpBlockHeaders,
            } ) => DescriptHttpBlockHeaders
        );

    body?:
        string |
        Buffer |
        ( ( args: DescriptBlockBaseCallbackArgs< Params, Context > ) => string | Buffer | DescriptJSON );

    is_json?: boolean;

    timeout?: number;

    is_error?: ( error: DescriptError, request_options: HttpsRequestOptions ) => boolean;

    is_retry_allowed?: ( error: DescriptError, request_options: HttpsRequestOptions ) => boolean;
    max_retries?: number;
    retry_timeout?: number;

    prepare_request_options?: ( options: HttpsRequestOptions ) => HttpsRequestOptions;

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
    Params,
    Context,
    Result,
> {
    < ExtendedParamsIn = Params, ExtendedResultOut = Result>( args: {
        block?: DescriptHttpBlockDescription< Params, Context >,
        options?: DescriptBlockOptions< ExtendedParamsIn, Params, Context, Result, ExtendedResultOut >,
    } ): DescriptHttpBlock< ExtendedParamsIn, Context, ExtendedResultOut >;
}

declare function http<
    ParamsIn,
    ParamsOut,
    Context,
    ResultIn,
    ResultOut,
> (
    args: {
        block: DescriptHttpBlockDescription< ParamsOut, Context >,
        options?: DescriptBlockOptions< ParamsIn, ParamsOut, Context, ResultIn, ResultOut >,
    },
): DescriptHttpBlock< ParamsIn, Context, ResultOut >;


/*
//  ---------------------------------------------------------------------------------------------------------------  //
//  FuncBlock

type DescriptFuncBlockDescription<
    Params,
    Context,
    Result,
> = ( args: DescriptBlockBaseCallbackArgs< Params, Context > & {
    generate_id: DescriptBlockGenerateId,
    cancel: Cancel,
} ) =>
    Result |
    //  DescriptBlock< Params, Context, Result > |
    Promise< Result >;

interface DescriptFuncBlock<
    Params,
    Context,
    Result,
> {
    < ExtendedParamsIn, ExtendedResultOut >( args: {
        block?: DescriptFuncBlockDescription< Params, Context, Result >,
        options?: DescriptBlockOptions<ExtendedParamsIn, Params, Context, Result, ExtendedResultOut >,
    } ): DescriptFuncBlock< ExtendedParamsIn, Context, ExtendedResultOut >;
}

declare function func<
    ParamsIn,
    ParamsOut,
    Context,
    ResultIn,
    ResultOut,
> (
    args: {
        block: DescriptFuncBlockDescription< ParamsOut, Context, ResultOut >,
        options?: DescriptBlockOptions< ParamsIn, ParamsOut, Context, ResultIn, ResultOut >,
    },
): DescriptFuncBlock< ParamsIn, Context, ResultOut >;
*/

//  ---------------------------------------------------------------------------------------------------------------  //
//  ArrayBlock

export type GetArrayBlockResult< T > = {
    0: never,
    1: [ GetDescriptBlockResult< First< T > > ],
    2: [ GetDescriptBlockResult< First< T > >,  ...GetArrayBlockResult< Tail< T > > ],
}[ T extends [] ? 0 : T extends ( ( readonly [ any ] ) | [ any ] ) ? 1 : 2 ];

export type GetArrayBlockParams< T > = {
    0: never,
    1: GetDescriptBlockParams< First< T > >,
    2: GetDescriptBlockParams< First< T > > & GetArrayBlockParams< Tail< T > >,
}[ T extends [] ? 0 : T extends ( ( readonly [ any ] ) | [ any ] ) ? 1 : 2 ];

export type GetArrayBlockContext< T > = {
    0: never,
    1: GetDescriptBlockContext< First< T > >,
    2: Equal< GetDescriptBlockContext< First< T > >, GetArrayBlockContext< Tail< T > > >,
}[ T extends [] ? 0 : T extends ( ( readonly [ any ] ) | [ any ] ) ? 1 : 2 ];

type DescriptArrayBlockDescription< T extends ReadonlyArray< any > | Array< any > > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Params, infer Context, infer Result > ? T[ P ] : never
}

interface DescriptArrayBlock<
    Params,
    Context,
    Result,
> {
    < ExtendedParamsIn = Params, ExtendedResultOut = Result >( args: {
        options?: DescriptBlockOptions< ExtendedParamsIn, Params, Context, Result, ExtendedResultOut >,
    } ): DescriptArrayBlock< ExtendedParamsIn, Context, ExtendedResultOut >;
}

declare function array<
    Block extends ReadonlyArray< any >,
    Context = GetArrayBlockContext< Block >,
    ParamsOut = GetArrayBlockParams< Block >,
    ResultIn = GetArrayBlockResult< Block >,
    ResultOut = ResultIn,
> (
    args: {
        //  block: DescriptArrayBlockDescription< Block >,
        block: Block,
        options?: DescriptBlockOptions<
            GetArrayBlockParams< Block >,
            ParamsOut,
            Context,
            ResultIn,
            ResultOut
        >,
    },
): DescriptArrayBlock< GetArrayBlockParams< Block >, Context, ResultOut >;

//  ---------------------------------------------------------------------------------------------------------------  //
/*

interface DescriptObjectBlockDescription {
    [ property: string ]: DescriptBlock;
}

interface DescriptObjectBlock {
    ( args: { block?: DescriptObjectBlockDescription, options?: DescriptBlockOptions } ): DescriptObjectBlock;
}

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

type DescriptBlock< Params, Context, Result > =
    DescriptHttpBlock< Params, Context, Result > |
    //  DescriptFuncBlock< Params, Context, Result > |
    DescriptArrayBlock< Params, Context, Result >;

/*
type DescriptBlock<
    Params,
    Result,
    Context,
> =
    DescriptHttpBlock< Params, Result, Context > |
    DescriptFuncBlock< Params, Result, Context > |
    DescriptArrayBlock< Params, Result, Context>;
*/

//  ---------------------------------------------------------------------------------------------------------------  //

export type GetDescriptBlockResult< T > =
    T extends DescriptBlock< infer Params, infer Context, infer Result > ? Result : never;

export type GetDescriptBlockParams< T > =
    T extends DescriptBlock< infer Params, infer Context, infer Result > ? Params : never;

export type GetDescriptBlockContext< T > =
    T extends DescriptBlock< infer Params, infer Context, infer Result > ? Context : never;

    //  ---------------------------------------------------------------------------------------------------------------  //

declare function run<
    Params,
    Context,
    Result,
> (
    block: DescriptBlock< Params, Context, Result >,
    args: Partial< DescriptBlockBaseCallbackArgs< Params, Context > >,
): Promise< Result >;

declare function is_block( block: any ): boolean;

//  declare function array( args: { block: DescriptArrayBlockDescription, options?: DescriptBlockOptions } ): DescriptArrayBlock;
//  declare function object( args: { block: DescriptObjectBlockDescription, options?: DescriptBlockOptions } ): DescriptObjectBlock;
//  declare function pipe( args: { block: DescriptPipeBlockDescription, options?: DescriptBlockOptions } ): DescriptPipeBlock;
//  declare function first( args: { block: DescriptFirstBlockDescription, options?: DescriptBlockOptions } ): DescriptFirstBlock;

declare function error( error: { id: string; message?: string } ): DescriptError;
declare function is_error( error: any ): boolean;

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

