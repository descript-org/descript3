import RunContext from './context';
import { ERROR_ID, createError, isError, DescriptError } from './error';

import Cancel from './cancel';
import Logger, { EVENT } from './logger';
import type { LoggerEvent, LoggerInterface } from './logger';
import Cache, { CacheInterface } from './cache';

import request from './request';
import type { GenerateId, DescriptBlockDeps, DescriptBlockId } from './depsDomain';
import Block from './block';
import ArrayBlock from './arrayBlock';
import ObjectBlock from './objectBlock';
import type { FunctionBlockDefinition } from './functionBlock';
import FunctionBlock from './functionBlock';
import HttpBlock from './httpBlock';
import FirstBlock from './firstBlock';

import type {
    DescriptHttpBlockResult,
    BlockResultOut,
    DescriptBlockOptions,
    DescriptHttpBlockHeaders,
    InferResultFromBlock,
    InferParamsInFromBlock,
    InferBlock,
    InferHttpBlock,
} from './types';
import type BaseBlock from './block';
import type { DescriptHttpBlockDescription, DescriptHttpBlockQuery, DescriptHttpBlockQueryValue } from './httpBlock';
import type { GetObjectBlockParams, GetObjectBlockResult, ObjectBlockDefinition } from './objectBlock';
import type { GetArrayBlockParams, GetArrayBlockResult, ArrayBlockDefinition } from './arrayBlock';
import type { GetFirstBlockParams, GetFirstBlockResult, FirstBlockDefinition } from './firstBlock';
import type { GetPipeBlockParams, GetPipeBlockResult, PipeBlockDefinition } from './pipeBlock';
import PipeBlock from './pipeBlock';

const func = function<
    Context,
    ParamsOut,
    BlockResult,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = ParamsOut
>({ block, options }: {
    block: FunctionBlockDefinition<Context, ParamsOut, BlockResult>;
    options?: DescriptBlockOptions<
    Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params
    >;
}) {
    return new FunctionBlock<
    Context, ParamsOut, BlockResult, ResultOut, BeforeResultOut, AfterResultOut, ErrorResultOut, Params
    >({ block, options });
};
const array = function<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetArrayBlockParams<Block>,
    BlockResult = GetArrayBlockResult<Block>,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetArrayBlockParams<Block>,
>({ block, options }: {
    block: ArrayBlockDefinition<Block>;
    options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
}) {
    return new ArrayBlock<Context, Block, ResultOut, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>({ block, options });
};
const object = function<
    Context,
    Blocks extends Record<string, any>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetObjectBlockParams<Blocks>,
    BlockResult = GetObjectBlockResult<Blocks>,

    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetObjectBlockParams<Blocks>,
>({ block, options }: {
    block?: ObjectBlockDefinition<Blocks>;
    options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
} = {}) {
    return new ObjectBlock<Context, Blocks, ResultOut, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>({ block, options });
};
const http = function<
    Context,
    ParamsOut,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    IntermediateResult,
    BlockResult extends DescriptHttpBlockResult<IntermediateResult>,

    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = ParamsOut,
>({ block, options }: {
    block?: DescriptHttpBlockDescription<ParamsOut, Context, IntermediateResult>;
    options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
}) {
    return new HttpBlock<
    Context, ParamsOut, IntermediateResult, ResultOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params
    >({ block, options });
};

const first = function<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetFirstBlockParams<Block>,
    BlockResult = GetFirstBlockResult<Block>,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetFirstBlockParams<Block>,
>({ block, options }: {
    block: FirstBlockDefinition<Block>;
    options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
}) {
    return new FirstBlock<Context, Block, ResultOut, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>({ block, options });
};

const pipe = function<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetPipeBlockParams<Block>,
    BlockResult = GetPipeBlockResult<Block>,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetPipeBlockParams<Block>,
>({ block, options }: {
    block: PipeBlockDefinition<Block>;
    options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
}) {
    return new PipeBlock<Context, Block, ResultOut, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>({ block, options });
};

const isBlock = function(block: any) {
    return (block instanceof Block);
};

const run = function<
    Context,
    CustomBlock,
    ParamsOut,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    IntermediateResult,
    BlockResult,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = ParamsOut,
>(
    block: BaseBlock<Context, CustomBlock, ParamsOut, ResultOut, IntermediateResult, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>,
    //block: FunctionBlock<Context, ParamsOut, BlockResult, ResultOut, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>,
    { params, context, cancel }: {
        params?: Params; context?: Context; cancel?: Cancel;
    } = {}) {

    const runContext = new RunContext<BlockResult, IntermediateResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>();

    if (!(params && typeof params === 'object')) {
        params = {} as Params;
    }
    if (!cancel) {
        cancel = new Cancel();
    }

    const blockCancel = cancel.create();
    //return block.run({ runContext, blockCancel, cancel, params });
    return runContext.run({ block, blockCancel, params, cancel, context });// as ReturnType<typeof block['run']>;
};

export {
    Logger,
    LoggerEvent,
    LoggerInterface,
    EVENT as LOGGER_EVENT,
    Cache,
    CacheInterface,
    request,
    ERROR_ID,
    createError as error,
    isError,
    Cancel,
    func,
    array,
    object,
    http,
    first,
    pipe,
    isBlock,
    run,
    DescriptError,
    DescriptHttpBlockResult,
    DescriptHttpBlockHeaders,
    DescriptHttpBlockDescription,
    DescriptHttpBlockQuery,
    DescriptHttpBlockQueryValue,
    GenerateId,
    DescriptBlockId,
    InferResultFromBlock,
    InferParamsInFromBlock,
    InferBlock,
    DescriptBlockDeps,
    BaseBlock,
    BlockResultOut,
    InferHttpBlock,
    HttpBlock,
};
