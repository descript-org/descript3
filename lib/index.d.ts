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

declare class Cache {
    get( args: { key: string, context: DescriptContext } ): DescriptBlockResult | Promise< DescriptBlockResult >;
    set( args: { key: string, value: DescriptBlockResult, maxage: number, context: DescriptContext } ): void;
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

interface DescriptLogger {
    log( event: LoggerEvent, context: DescriptContext ): void;
}

declare namespace Logger {
    export enum EVENT {
        REQUEST_START = 'REQUEST_START',
        REQUEST_SUCCESS = 'REQUEST_SUCCESS',
        REQUEST_ERROR = 'REQUEST_ERROR',
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptContext = any;

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptBlockId = symbol;
type DescriptBlockGenerateId = () => DescriptBlockId;

type DescriptBlockParams = Record< string, string | number | boolean | null | undefined >;

type DescriptBlockResult = DescriptJSON;

type DescriptBlockDeps = Record< DescriptBlockId, DescriptBlockResult >;

type DescriptBlockBeforeResult = DescriptBlockResult | DescriptBlock | Promise< DescriptBlockBeforeResult >;
type DescriptBlockAfterResult = DescriptBlockResult | DescriptBlock | Promise< DescriptBlockAfterResult >;

interface DescriptBlockBaseCallbackArgs {
    params: DescriptBlockParams;
    context: DescriptContext;
    deps: DescriptBlockDeps;
}

interface DescriptBlockOptions {
    name?: string;

    id?: DescriptBlockId;
    deps?: DescriptBlockId | Array< DescriptBlockId >;

    params?: ( args: DescriptBlockBaseCallbackArgs ) => DescriptBlockParams;

    before?: ( args: DescriptBlockBaseCallbackArgs & {
        cancel: Cancel,
    } ) => DescriptBlockBeforeResult;

    after?: ( args: DescriptBlockBaseCallbackArgs & {
        cancel: Cancel,
        result: DescriptBlockResult,
    } ) => DescriptBlockBeforeResult;

    error?: ( args: DescriptBlockBaseCallbackArgs & {
        cancel: Cancel,
        error: DescriptError,
    } ) => DescriptBlockBeforeResult;

    timeout?: number;

    key?: string | ( ( args: DescriptBlockBaseCallbackArgs ) => string );
    maxage?: number;
    cache?: Cache;

    required?: boolean;

    logger?: DescriptLogger;
}

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptHttpBlockDescriptionCallback< T > = T | ( ( args: DescriptBlockBaseCallbackArgs ) => T );

type DescriptHttpBlockQueryValue = string | number | boolean;
type DescriptHttpBlockQuery = Record< string, DescriptHttpBlockQueryValue >;

type DescriptHttpBlockHeaders = Record< string, string >;

interface DescriptHttpBlockDescription {
    protocol?: DescriptHttpBlockDescriptionCallback< string >;
    hostname?: DescriptHttpBlockDescriptionCallback< string >;
    port?: DescriptHttpBlockDescriptionCallback< number >;
    method?: DescriptHttpBlockDescriptionCallback< string >;
    pathname?: DescriptHttpBlockDescriptionCallback< string >;

    query?:
        Record< string,
            DescriptHttpBlockQueryValue |
            null |
            ( ( args: DescriptBlockBaseCallbackArgs & {
                query: DescriptHttpBlockQuery,
            } ) => DescriptHttpBlockQueryValue )
        > |
        (
            ( args: DescriptBlockBaseCallbackArgs & {
                query: DescriptHttpBlockQuery,
            } ) => DescriptHttpBlockQuery
        );

    headers?:
        Record< string,
            string |
            ( ( args: DescriptBlockBaseCallbackArgs & {
                headers: DescriptHttpBlockHeaders,
            } ) => string )
        > |
        (
            ( args: DescriptBlockBaseCallbackArgs & {
                headers: DescriptHttpBlockHeaders,
            } ) => DescriptHttpBlockHeaders
        );

    body?:
        string |
        Buffer |
        ( ( args: DescriptBlockBaseCallbackArgs ) => string | Buffer | DescriptJSON );

    is_json?: boolean;

    timeout?: number;

    is_error?: ( error: DescriptError, request_options: HttpsRequestOptions ) => boolean;

    is_retry_allowed?: ( error: DescriptError, request_options: HttpsRequestOptions ) => boolean;
    max_retries?: number;
    retry_timeout?: number;

    prepare_request_options?: ( options: HttpsRequestOptions ) => HttpsRequestOptions;

    family?: DescriptHttpBlockDescriptionCallback< number >;

    agent?: HttpsAgent | HttpsAgentOptions | false;

    auth?: DescriptHttpBlockDescriptionCallback< string >;

    ca?: DescriptHttpBlockDescriptionCallback< string | Buffer >;
    cert?: DescriptHttpBlockDescriptionCallback< string | Buffer >;
    ciphers?: DescriptHttpBlockDescriptionCallback< string >;
    key?: DescriptHttpBlockDescriptionCallback< string | Buffer >;
    passphrase?: DescriptHttpBlockDescriptionCallback< string >;
    pfx?: DescriptHttpBlockDescriptionCallback< string | Buffer >;
    rejectUnauthorized?: DescriptHttpBlockDescriptionCallback< boolean >;
    secureProtocol?: DescriptHttpBlockDescriptionCallback< string >;
    servername?: DescriptHttpBlockDescriptionCallback< string >;
}

interface DescriptHttpBlock {
    ( args: { block?: DescriptHttpBlockDescription, options?: DescriptBlockOptions } ): DescriptHttpBlock;
}

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptFuncBlockDescription = ( args: DescriptBlockBaseCallbackArgs & {
    generate_id: DescriptBlockGenerateId,
    cancel: Cancel,
} ) =>
    DescriptBlock |
    DescriptBlockResult |
    Promise< DescriptBlock | DescriptBlockResult >;

interface DescriptFuncBlock {
    ( args: { block?: DescriptFuncBlockDescription, options?: DescriptBlockOptions } ): DescriptFuncBlock;
}

//  ---------------------------------------------------------------------------------------------------------------  //

type DescriptArrayBlockDescription = Array< DescriptBlock >;

interface DescriptArrayBlock {
    ( args: { block?: DescriptArrayBlockDescription, options?: DescriptBlockOptions } ): DescriptArrayBlock;
}

//  ---------------------------------------------------------------------------------------------------------------  //

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

type DescriptBlock =
    DescriptHttpBlock |
    DescriptFuncBlock |
    DescriptArrayBlock |
    DescriptObjectBlock |
    DescriptPipeBlock |
    DescriptFirstBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

declare function run( block: DescriptBlock, args: Partial< DescriptBlockBaseCallbackArgs > ): Promise< DescriptBlockResult >;
declare function is_block( block: any ): boolean;

declare function func( args: { block: DescriptFuncBlockDescription, options?: DescriptBlockOptions } ): DescriptFuncBlock;
declare function http( args: { block: DescriptHttpBlockDescription, options?: DescriptBlockOptions } ): DescriptHttpBlock;
declare function array( args: { block: DescriptArrayBlockDescription, options?: DescriptBlockOptions } ): DescriptArrayBlock;
declare function object( args: { block: DescriptObjectBlockDescription, options?: DescriptBlockOptions } ): DescriptObjectBlock;
declare function pipe( args: { block: DescriptPipeBlockDescription, options?: DescriptBlockOptions } ): DescriptPipeBlock;
declare function first( args: { block: DescriptFirstBlockDescription, options?: DescriptBlockOptions } ): DescriptFirstBlock;

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

