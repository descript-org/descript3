import { ZlibOptions } from 'node:zlib';

type First< T > =
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? First : never;

type Tail< T > =
    T extends readonly [ infer First, ...infer Rest ] | [ infer First, ...infer Rest ] ? Rest : never;

type Equal< A, B > = A extends B ? ( B extends A ? A : never ) : never;

type UnionToIntersection< U > = (
    U extends any ?
        ( k: U ) => void :
        never
    ) extends (
    ( k: infer I ) => void
    ) ? I : never;

type InferContext<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? Context : never;
type InferParamsIn<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ParamsIn : never;
type InferParamsOut<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ParamsOut : never;
type InferResultIn<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ResultIn : never;
type InferResultOut<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ResultOut : never;


type DescriptBlockParams<BlockParams, ParamsFnIn = BlockParams, ParamsFnOut = ParamsFnIn> = {
    b: BlockParams;
    i: ParamsFnIn;
    o: ParamsFnOut;
};
type GetDescriptBlockParamsBlock<T> = T extends DescriptBlockParams<infer BlockParams, infer ParamsFnIn, infer ParamsFnOut> ? BlockParams : T;
type GetDescriptBlockParamsFnIn<T> = T extends DescriptBlockParams<infer BlockParams, infer ParamsFnIn, infer ParamsFnOut> ? ParamsFnIn : T;
type GetDescriptBlockParamsFnOut<T> = T extends DescriptBlockParams<infer BlockParams, infer ParamsFnIn, infer ParamsFnOut> ? ParamsFnOut : T;

type DescriptBlockResult<ResultIn, ResultOut = ResultIn> = {
    i: ResultIn;
    o: ResultOut;
};
type GetDescriptBlockResultIn<T> = T extends DescriptBlockResult<infer ResultIn, infer ResultOut> ? ResultIn : T;
type GetDescriptBlockResultOut<T> = T extends DescriptBlockResult<infer ResultIn, infer ResultOut> ? ResultOut : T;

type InferResultInFromBlockOrReturnResultIn<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer Result, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut, infer ResultOut > ? Result : Type;
type InferResultOutFromBlockOrReturnResultOut<Type> = Type extends DescriptBlock< infer Context, infer ParamsIn, infer Result, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ResultOut : Type;
type InferParamsFromBlockOrReturnParams<Block, Params> = Block extends DescriptBlock< infer Context, infer ParamsIn, infer Result, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ParamsIn : Params;

type InferResultInFromBlocks<Block> = Block extends DescriptBlock< infer Context, infer ParamsIn, infer Result, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ?
    { [ K in keyof Result ]: InferResultInFromBlocks<Result[K]> } :
    Block;

type NotUnknown<T> = NonNullable<unknown extends T ? undefined : T>;

type InferResultOutFromBlocks<Block> = Block extends DescriptBlock< infer Context, infer ParamsIn, infer Result, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ?
    { [ K in keyof ResultOut ]: InferResultOutFromBlocks<ResultOut[K]> } :
    Block;

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
    object |
    Array< DescriptJSON >;

//  ---------------------------------------------------------------------------------------------------------------  //

interface DescriptError<Error = Buffer | null | unknown> {
    error: {
        id: string;
        message?: string;
        // для http-ошибок
        body?: Error;
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

interface DescriptBlockResultJSON<Result> {
    result: Result;
}

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
        body: number;
        request_end: number;
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

type ComplexResult<Result> = Result | GetDescriptBlockResultOut<Result> | Promise< Result | GetDescriptBlockResultOut<Result> > | void | null;

interface DescriptBlockOptions<
    Context,
    Params,
    ResultIn,
    ParamsOut = Params,
    BeforeResultOut = ResultIn,
    ErrorResultOut = ResultIn,
    AfterResultIn = ResultIn,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> {
    name?: string;

    id?: DescriptBlockId;
    deps?: DescriptBlockId | Array< DescriptBlockId >;

    params?: ( args: {
        params: Params,
        context: Context,
        deps: DescriptBlockDeps,
    } ) => ParamsOut;

    before?: ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
        cancel: Cancel,
    } ) => ComplexResult<BeforeResultOut>

    after?: ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
        cancel: Cancel,
        result: AfterResultIn,
    } ) => ComplexResult<AfterResultOut>

    error?: <E extends object>( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
        cancel: Cancel,
        error: DescriptError<E>,
    } ) => ComplexResult<ErrorResultOut>

    timeout?: number;

    key?: string | ( ( args: {
        params: ParamsOut,
        context: Context,
        deps: DescriptBlockDeps,
    } ) => string );
    maxage?: number;
    cache?: Cache< ResultOut | GetDescriptBlockResultOut<ResultOut>, Context >;

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

type DescriptHttpBlockQueryValue = string | number | boolean | undefined | Array<string | number | boolean | object>;
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

    body_compress?: boolean | ZlibOptions;

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
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = Result,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> {
    <
        ExtendedParams = Params,
        ExtendedResult = Result,
        ExtendedParamsOut = ExtendedParams,
        ExtendedBeforeResultOut = undefined,
        ExtendedErrorResultOut = undefined,
        ExtendedAfterResultIn = ExtendedResult,
        ExtendedAfterResultOut = ExtendedAfterResultIn,
        ExtendedResultOut = Exclude<ExtendedBeforeResultOut | ExtendedErrorResultOut | ExtendedAfterResultOut, undefined>,
    >( args: {
        block?: DescriptHttpBlockDescription< GetDescriptBlockParamsFnOut<ExtendedParamsOut>, Context >,
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<ExtendedParams>,
            GetDescriptBlockResultIn<ExtendedResult>,
            GetDescriptBlockParamsFnOut<ExtendedParamsOut>,
            ExtendedBeforeResultOut,
            ExtendedErrorResultOut,
            GetDescriptBlockResultIn<ExtendedAfterResultIn>,
            ExtendedAfterResultOut,
            ExtendedResultOut
        >,
    } ): DescriptHttpBlock<
        Context,
        DescriptBlockParams<GetDescriptBlockParamsBlock<ExtendedParams>, GetDescriptBlockParamsFnOut<ExtendedParamsOut>>,
        GetDescriptBlockResultOut<InferResultOutFromBlockOrReturnResultOut<ExtendedResultOut>>
    >;
}

declare function http<
    Context,
    Params,
    Result,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = Result,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> (
    args: {
        block: DescriptHttpBlockDescription< GetDescriptBlockParamsFnOut<ParamsOut>, Context >,
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<Params>,
            GetDescriptBlockResultIn<Result>,
            GetDescriptBlockParamsFnOut<ParamsOut>,
            BeforeResultOut,
            ErrorResultOut,
            GetDescriptBlockResultIn<AfterResultIn>,
            AfterResultOut,
            ResultOut
        >,
    },
): DescriptHttpBlock<
    Context,
    DescriptBlockParams<GetDescriptBlockParamsBlock<Params>, GetDescriptBlockParamsFnOut<ParamsOut>>,
    GetDescriptBlockResultOut<ResultOut>
>;

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
    Promise<Result>;

interface DescriptFuncBlock<
    Context,
    Params,
    Result,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = Result,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> {
    <
        ExtendedParams = Params,
        ExtendedResult = Result,
        ExtendedParamsOut = ExtendedParams,
        ExtendedBeforeResultOut = undefined,
        ExtendedErrorResultOut = undefined,
        ExtendedAfterResultIn = ExtendedResult,
        ExtendedAfterResultOut = ExtendedAfterResultIn,
        ExtendedResultOut = ExtendedBeforeResultOut | ExtendedErrorResultOut | ExtendedAfterResultOut,
    >( args: {
        block?: DescriptFuncBlockDescription< Context, GetDescriptBlockParamsFnOut<ExtendedParamsOut>, GetDescriptBlockResultIn<ExtendedResult>>,
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<ExtendedParams>,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ExtendedResult>>,
            GetDescriptBlockParamsFnOut<ExtendedParamsOut>,
            ExtendedBeforeResultOut,
            ExtendedErrorResultOut,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ExtendedAfterResultIn>>,
            ExtendedAfterResultOut,
            ExtendedResultOut
        >,
    } ): DescriptFuncBlock< Context,
        DescriptBlockParams<GetDescriptBlockParamsBlock<InferParamsFromBlockOrReturnParams<ExtendedResult, ExtendedParams>>, GetDescriptBlockParamsFnOut<InferParamsFromBlockOrReturnParams<ExtendedResult, ExtendedParamsOut>>>,
        GetDescriptBlockResultOut<InferResultOutFromBlocks<ExtendedResultOut>>
    >;
}

declare function func<
    Context,
    Params,
    ResultIn,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = ResultIn,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> (
    args: {
        block: DescriptFuncBlockDescription< Context, GetDescriptBlockParamsFnOut<ParamsOut>, GetDescriptBlockResultIn<ResultIn> >,
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<Params>,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ResultIn>>,
            GetDescriptBlockParamsFnOut<ParamsOut>,
            BeforeResultOut,
            ErrorResultOut,
            GetDescriptBlockResultIn<InferResultInFromBlocks<AfterResultIn>>,
            AfterResultOut,
            ResultOut
        >,
    },
): DescriptFuncBlock< Context,
    DescriptBlockParams<GetDescriptBlockParamsBlock<InferParamsFromBlockOrReturnParams<ResultIn, Params>>, GetDescriptBlockParamsFnOut<InferParamsFromBlockOrReturnParams<ResultIn, ParamsOut>>>,
    GetDescriptBlockResultOut<InferResultOutFromBlocks<ResultOut>>
>;

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

type DescriptArrayBlockDescription< T > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut, infer Result > ? T[ P ] : never
}

interface DescriptArrayBlock<
    Context,
    Params,
    ResultIn,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = ResultIn,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> {
    <
        ExtendedParams = Params,
        ExtendedResultIn = ResultIn,
        ExtendedParamsOut = ExtendedParams,
        ExtendedBeforeResultOut = undefined,
        ExtendedErrorResultOut = undefined,
        ExtendedAfterResultIn = ExtendedResultIn,
        ExtendedAfterResultOut = ExtendedAfterResultIn,
        ExtendedResultOut = Exclude<ExtendedBeforeResultOut | ExtendedErrorResultOut | ExtendedAfterResultOut, undefined>,
    >( args: {
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<ExtendedParams>,
            ExtendedResultIn,
            GetDescriptBlockParamsFnOut<ExtendedParamsOut>,
            ExtendedBeforeResultOut,
            ExtendedErrorResultOut,
            ExtendedAfterResultIn,
            ExtendedAfterResultOut,
            ExtendedResultOut
        >,
    } ): DescriptArrayBlock<
        Context,
        DescriptBlockParams<GetDescriptBlockParamsBlock<ExtendedParams>, GetDescriptBlockParamsFnOut<ExtendedParamsOut>>,
        GetDescriptBlockResultOut<InferResultOutFromBlockOrReturnResultOut<ExtendedResultOut>>
    >;
}

declare function array<
    Block extends ReadonlyArray< unknown >,
    Context = GetArrayBlockContext< Block >,
    Params = GetArrayBlockParams< Block >,
    ResultIn = GetArrayBlockResult< Block >,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = GetArrayBlockResult< Block >,
    AfterResultOut = GetArrayBlockResult< Block >,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> (
    args: {
        block: DescriptArrayBlockDescription< Block >,
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<Params>,
            ResultIn,
            GetDescriptBlockParamsFnOut<ParamsOut>,
            BeforeResultOut,
            ErrorResultOut,
            AfterResultIn,
            AfterResultOut,
            ResultOut
        >,
    },
): DescriptArrayBlock<
    Context,
    DescriptBlockParams<GetDescriptBlockParamsBlock<Params>, GetDescriptBlockParamsFnOut<ParamsOut>>,
    GetDescriptBlockResultOut<InferResultOutFromBlockOrReturnResultOut<ResultOut>>
>;

//  ---------------------------------------------------------------------------------------------------------------  //
//  ObjectBlock

type GetObjectBlockResultIn< T > = {
    [ P in keyof T ]: InferResultIn<T[P]>
}
type GetObjectBlockResultOut< T > = {
    [ P in keyof T ]: InferResultOut<T[P]>
}
type GetObjectBlockParamsMap< T extends {} > = {
    [ P in keyof T ]: InferParamsIn<T[ P ]>;
}

type GetObjectBlockParamsBlockMap< T extends {} > = {
    [ P in keyof T ]: GetDescriptBlockParamsBlock<InferParamsIn<T[ P ]>>;
}

type GetObjectBlockParamsFnInMap< T extends {} > = {
    [ P in keyof T ]: GetDescriptBlockParamsFnIn<InferParamsIn<T[ P ]>>;
}

type GetObjectBlockParamsFnOutMap< T extends {} > = {
    [ P in keyof T ]: GetDescriptBlockParamsFnOut<InferParamsOut<T[ P ]>>;
}

type GetObjectBlockParams<
    T extends {},
    PB = GetObjectBlockParamsBlockMap< T >,
    PI = GetObjectBlockParamsFnInMap< T >,
    PO = GetObjectBlockParamsFnOutMap< T >,
> = DescriptBlockParams<
    UnionToIntersection<PB[ keyof PB ]>,
    UnionToIntersection<PI[ keyof PI ]>,
    UnionToIntersection<PO[ keyof PO ]>
>;

type GetObjectBlockContextMap< T extends {} > = {
    [ P in keyof T ]: InferContext<T[ P ]>;
}
//  Тут не совсем правда, но лучше пока непонятно как сделать.
type GetObjectBlockContext< T extends {}, M = GetObjectBlockContextMap< T > > = UnionToIntersection< M[ keyof M ] >;

type DescriptObjectBlockDescription< T extends {} > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer ResultIn, infer ParamsOut,  infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut, infer ResultOut > ? T[ P ] : never
}

type DescriptObjectBlockDescriptionResults< T extends {} > = {
    [ P in keyof T ]: T[ P ] extends DescriptBlock< infer Context, infer Params, infer ResultIn, infer ParamsOut, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer ResultOut > ? ResultOut : never
}

interface DescriptObjectBlock<
    Context,
    Params,
    ResultIn,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = ResultIn,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> {
    <
        ExtendedParams = Params,
        ExtendedResultIn = ResultIn,
        ExtendedParamsOut = ExtendedParams,
        ExtendedBeforeResultOut = undefined,
        ExtendedErrorResultOut = undefined,
        ExtendedAfterResultIn = ExtendedResultIn,
        ExtendedAfterResultOut = ExtendedAfterResultIn,
        ExtendedResultOut = Exclude<ExtendedBeforeResultOut | ExtendedErrorResultOut | ExtendedAfterResultOut, undefined>,
    >( args: {
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<ExtendedParams>,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ExtendedResultIn>>,
            GetDescriptBlockParamsFnOut<ExtendedParamsOut>,
            ExtendedBeforeResultOut,
            ExtendedErrorResultOut,
            ExtendedAfterResultIn,
            ExtendedAfterResultOut,
            ExtendedResultOut
        >,
    } ): DescriptObjectBlock<
        Context,
        DescriptBlockParams<GetDescriptBlockParamsBlock<ExtendedParams>, GetDescriptBlockParamsFnOut<ExtendedParamsOut>>,
        GetDescriptBlockResultOut<InferResultOutFromBlocks<ExtendedResultOut>>
    >;
}

declare function object<
    Block extends {},
    Context = GetObjectBlockContext< Block >,
    Params = GetObjectBlockParams< Block >,
    ResultIn = GetObjectBlockResultIn< Block >,
    ParamsOut = Params,
    //ResultOut = GetObjectBlockResultOut<Block>,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = GetObjectBlockResultOut<Block>,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> (
    args: {
        block: DescriptObjectBlockDescription< Block >,
        options?: DescriptBlockOptions<
            Context,
            GetDescriptBlockParamsFnIn<Params>,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ResultIn>>,
            GetDescriptBlockParamsFnOut<ParamsOut>,
            BeforeResultOut,
            ErrorResultOut,
            GetDescriptBlockResultIn<InferResultInFromBlocks<AfterResultIn>>,
            AfterResultOut,
            ResultOut
            /*GetDescriptBlockResultIn<InferResultInFromBlocks<ResultIn>>,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ResultIn>>,
            GetDescriptBlockResultIn<InferResultInFromBlocks<ResultIn>>,
            InferResultOutFromBlocks<ResultOut>,
            InferResultOutFromBlocks<ResultOut>*/
        >,
    },
): DescriptObjectBlock<
    Context,
    DescriptBlockParams<GetDescriptBlockParamsBlock<Params>, GetDescriptBlockParamsFnOut<ParamsOut>>,
    GetDescriptBlockResultOut<InferResultOutFromBlocks<ResultOut>>
>;

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

type DescriptBlock< Context, Params, Result, ParamsOut = Params, BeforeResultOut = Result, ErrorResultOut = Result, AfterResultIn = Result, AfterResultOut = Result, ResultOut = BeforeResultOut | ErrorResultOut | AfterResultOut > =
    DescriptHttpBlock< Context, Params, Result, ParamsOut, BeforeResultOut, ErrorResultOut, AfterResultIn, AfterResultOut, ResultOut > |
    DescriptFuncBlock< Context, Params, Result, ParamsOut, BeforeResultOut, ErrorResultOut, AfterResultIn, AfterResultOut, ResultOut > |
    DescriptArrayBlock< Context, Params, Result, ParamsOut, BeforeResultOut, ErrorResultOut, AfterResultIn, AfterResultOut, ResultOut > |
    DescriptObjectBlock< Context, Params, Result, ParamsOut, BeforeResultOut, ErrorResultOut, AfterResultIn, AfterResultOut, ResultOut >;

//  ---------------------------------------------------------------------------------------------------------------  //

export type GetDescriptBlockResult< T > =
    T extends DescriptBlock< infer Context, infer Params,  infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut, infer Result > ? Result : never;

export type GetDescriptBlockParams< T > =
    T extends DescriptBlock< infer Context, infer Params, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer Result > ? Params : never;

export type GetDescriptBlockContext< T > =
    T extends DescriptBlock< infer Context, infer Params, infer BeforeResultOut, infer ErrorResultOut, infer AfterResultIn, infer AfterResultOut,  infer Result > ? Context : never;

//  ---------------------------------------------------------------------------------------------------------------  //

declare function run<
    Context,
    Params,
    Result,
    ParamsOut = Params,
    BeforeResultOut = undefined,
    ErrorResultOut = undefined,
    AfterResultIn = Result,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
> (
    block: DescriptBlock<
        Context,
        GetDescriptBlockParamsFnIn<Params>,
        GetDescriptBlockResultIn<InferResultInFromBlocks<Result>>,
        GetDescriptBlockParamsFnOut<ParamsOut>,
        BeforeResultOut,
        ErrorResultOut,
        AfterResultIn,
        AfterResultOut,
        ResultOut
    >,
    args: {
        params?: GetDescriptBlockParamsBlock<Params>,
        context?: Context,
    },
): Promise< GetDescriptBlockResultOut<InferResultOutFromBlocks<ResultOut>>> ;

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


declare function inferBlockTypes<
    Context,
    Params,
    ResultIn,
    ParamsOut = Params,
    BeforeResultOut = ResultIn,
    ErrorResultOut = ResultIn,
    AfterResultIn = ResultIn,
    AfterResultOut = AfterResultIn,
    ResultOut = Exclude<BeforeResultOut | ErrorResultOut | AfterResultOut, undefined>,
>(block: DescriptBlock<Context, Params, ResultIn, ParamsOut, BeforeResultOut, ErrorResultOut, AfterResultIn, AfterResultOut, ResultOut>): typeof block;
