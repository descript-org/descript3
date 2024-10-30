import { createError, ERROR_ID } from './error' ;

import type { DescriptBlockDeps, DescriptBlockId } from './depsDomain';
import DepsDomain from './depsDomain' ;
import type Cancel from './cancel';
import type ContextClass from './context';
import type { BlockResultOut, InferResultOrResult, DescriptBlockOptions, DepsIds } from './types';

type BlockOptions<
    Context,
    ParamsOut,
    BlockResult,

    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params,
> =
    {

        deps?: DepsIds | null;
        lifecycle: Array<
        Pick<
        DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>,
        'before' | 'after' | 'error' | 'params'
        >
        >;
    } & Partial<Omit<
    DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>,
    'before' | 'after' | 'error' | 'params' | 'deps'
    >>


interface BlockConstructor<
    Context,
    ParamsOut,
    BlockResult,
    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params,
    ClassType,
    CustomBlock
> {
    new ({ block, options }: {
        block?: CustomBlock;
        options: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;
    }): ClassType;
}

abstract class BaseBlock<
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
> {
    protected block: CustomBlock;
    protected options: BlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;

    isRequired(): boolean {
        return Boolean(this.options.required);
    }

    constructor({ block, options }: {
        block?: CustomBlock;

        options?: DescriptBlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params> |
        BlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>;

    }) {
        // если таки умудрились не передать блок, то кастомный  initBlock в большинстве блоков кинет ошибку
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.initBlock(block);
        this.initOptions(options);
    }

    protected extendClass<
        ClassType,
        ExtendedBlockResult,
        ExtendedParamsOut = Params,
        ExtendedParams = Params,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
    >({ block, options }: {
        block?: CustomBlock;
        options?:
        DescriptBlockOptions<
        Context, Params & ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >;
    }): ClassType {

        return new (<BlockConstructor<
        Context,
        Params & ExtendedParamsOut,
        ExtendedBlockResult,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut,
        ExtendedParams,
        ClassType,
        CustomBlock
        >> this.constructor)({
            block: this.extendBlock(block),
            options: this.extendOptions(this.options, options),
        });
    }

    abstract extend<
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ExtendedResultOut extends
        BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        ExtendedParamsOut = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
    >({ block, options }: {
        block?: CustomBlock;
        options?: DescriptBlockOptions<
        Context, Params & ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >;
    }): unknown

    protected initBlock(block: CustomBlock) {
        this.block = block;
    }

    protected initOptions(options?: DescriptBlockOptions<Context, ParamsOut,
    BlockResult,
    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params> | BlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>) {
        this.options = this.extendOptions({ lifecycle: [] }, options);
    }

    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected extendBlock(block?: CustomBlock) {
        return this.block;
    }

    protected extendOptions<
        ExtendedParamsOut,
        ExtendedBlockResult,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut,
        ExtendedParams,
    >(
        what: BlockOptions<Context, ParamsOut, BlockResult,
        BeforeResultOut, AfterResultOut, ErrorResultOut, Params>,
        by: DescriptBlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult,
        ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        > | BlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult,
        ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        > = {},
    ) {
        const options: BlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult,
        ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        > = {
            deps: extendDeps(by.deps),
            lifecycle: [],
        };

        options.name = by.name || what.name;
        options.id = by.id;

        options.lifecycle = this.extendLifecycle(what, by);

        options.timeout = by.timeout || what.timeout || 0;

        options.key = (by.key || what.key) as BlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult,
        ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >['key'];
        options.maxage = by.maxage || what.maxage;
        options.cache = (by.cache || what.cache) as BlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult,
        ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >['cache'];

        options.required = by.required;

        options.logger = by.logger || what.logger;

        return options;
    }

    private extendLifecycle<
        ExtendedParamsOut,
        ExtendedBlockResult,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
        ExtendedParams = ExtendedParamsOut,
        // eslint-disable-next-line max-len
        W extends BlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params> =
        BlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>,
        B extends DescriptBlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        > | BlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        > =
        DescriptBlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        > | BlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >
    >(what: W, by: B): BlockOptions<
    Context, ExtendedParamsOut, ExtendedBlockResult,
    ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams>['lifecycle'] {
        const newArray: BlockOptions<Context, ParamsOut, BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut, Params>['lifecycle'] = [];

        if ('lifecycle' in by && by.lifecycle) {
            return ((what.lifecycle) ? newArray.concat(by.lifecycle as typeof newArray, what.lifecycle) : newArray.concat(by.lifecycle as typeof newArray)) as
                Array<DescriptBlockOptions<
                Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut,
                ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
                >>;

        } else if (!('lifecycle' in by) && (by.params || by.before || by.after || by.error)) {
            const lifecycle: Array<DescriptBlockOptions<
            Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut,
            ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
            >> = [
                {
                    params: by.params,
                    before: by.before,
                    after: by.after,
                    error: by.error,
                },
            ];

            return (what.lifecycle) ? lifecycle.concat(what.lifecycle as typeof lifecycle) : lifecycle;

        } else {
            return ((what.lifecycle) ? (newArray).concat(what.lifecycle) : []) as Array<DescriptBlockOptions<
            Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut,
            ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
            >>;
        }
    }

    async run(
        { runContext, blockCancel, depsDomain, cancel, params, context, prev, nParents }:
        {
            runContext: ContextClass<BlockResult, IntermediateResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
            blockCancel: Cancel;
            depsDomain?: DepsDomain;
            params?: Params;
            context?: Context;
            cancel: Cancel;
            prev?: unknown;
            nParents?: number;
        }): Promise<InferResultOrResult<ResultOut>> {

        let hTimeout: NodeJS.Timeout | null = null;

        function internalClearTimeout() {
            if (hTimeout) {
                clearTimeout(hTimeout);
                hTimeout = null;
            }
        }

        runContext.incNumberOfBlocks();

        let error;
        let result: InferResultOrResult<ResultOut> | undefined = undefined;
        let deps;
        let active;

        try {
            deps = await this.doOptionsDeps(runContext, blockCancel, depsDomain, nParents);

            active = true;

            runContext.incNumberOfActiveBlocks();

            //TODO типизировать
            if (prev !== undefined) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                deps.prev = prev;
            }

            if ((this.options.timeout || 0) > 0) {
                hTimeout = setTimeout(() => {
                    blockCancel.cancel(ERROR_ID.BLOCK_TIMED_OUT);
                    hTimeout = null;
                }, this.options.timeout);
            }

            const lifecycle = this.options.lifecycle;
            if (!lifecycle || !lifecycle.length) {
                //  В блоке нет ничего из options.params, options.before, options.after, options.error.
                //  Просто вызываем экшен.
                //
                // this.blockAction запускает для получения результата
                // работает с кешем
                result = await this.doAction(
                    { runContext, blockCancel, cancel, params: params as unknown as ParamsOut, context, deps, nParents: nParents || 0, depsDomain },
                ) as Awaited<InferResultOrResult<ResultOut>>;

            } else {
                result = await this.doLifecycleStep(
                    { index: 0, runContext, blockCancel, cancel, params: params as unknown as ParamsOut, context, deps, nParents: nParents || 0, depsDomain },
                );
            }

        } catch (e) {
            error = createError(e);
        }

        internalClearTimeout();

        blockCancel.close();

        if (active) {
            runContext.decNumberOfActiveBlocks();
        }
        runContext.decNumberOfBlocks();
        runContext.queueDepsCheck();

        if (this.options.id) {
            if (error) {
                runContext.rejectPromise(this.options.id, error);

            } else {
                runContext.resolvePromise(this.options.id, result as unknown as ResultOut);
            }
        }

        if (error) {
            throw error;
        }

        return result as InferResultOrResult<ResultOut>;
    }

    private async doOptionsDeps(
        runContext: ContextClass<BlockResult, IntermediateResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>,
        blockCancel: Cancel,
        depsDomain?: DepsDomain,
        nParents = 0,
    ) {
        const deps = this.options.deps;
        if (!deps || !deps.length) {
            return {};
        }

        if (!depsDomain) {
            throw createError(ERROR_ID.INVALID_DEPS_ID);
        }

        const promises = deps.map((id) => {
            if (!depsDomain.isValidId(id)) {
                throw createError(ERROR_ID.INVALID_DEPS_ID);
            }

            return runContext.getPromise(id);
        });

        runContext.addWaitingDeps({
            blockCancel: blockCancel,
            nParents: nParents,
        });

        try {
            const results = await Promise.race([
                blockCancel.getPromise(),
                Promise.all(promises),
            ]) as Array<unknown>;

            const r: DescriptBlockDeps = {};
            //TODO как это типизировать?
            deps.forEach((id, i) => {
                r[ id ] = results[ i ];
            });

            return r;

        } catch (error) {
            //  FIXME: А зачем вот это тут?
            const errorId = error.error.id;
            if (errorId === ERROR_ID.DEPS_NOT_RESOLVED) {
                throw error;
            }

            throw createError({
                id: ERROR_ID.DEPS_ERROR,
                reason: error,
            });

        } finally {
            runContext.removeWaitingDeps(blockCancel);
        }
    }

    private async doLifecycleStep({
        index,
        runContext,
        blockCancel,
        cancel,
        params,
        context,
        deps,
        nParents,
        depsDomain,
    }: {
        index: number;
        runContext: ContextClass<BlockResult, IntermediateResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<InferResultOrResult<ResultOut>> {
        const lifecycle = this.options.lifecycle;
        const step = lifecycle[ index ];

        let resultBefore: BeforeResultOut | undefined = undefined;
        let resultBlock: BlockResult | undefined = undefined;
        let resultAfter: AfterResultOut | undefined = undefined;
        let errorResult: ErrorResultOut | undefined = undefined;

        try {

            if (step.params) {
                if (typeof step.params !== 'function') {
                    throw createError('options.params must be a function', ERROR_ID.INVALID_OPTIONS_PARAMS);
                }

                //  Тут не нужен cancel.
                params = step.params({ params: params as unknown as Params, context, deps });
                if (!(params && typeof params === 'object')) {
                    throw createError('Result of options.params must be an object', ERROR_ID.INVALID_OPTIONS_PARAMS);
                }
            }

            if (typeof step.before === 'function') {
                resultBefore = await step.before({ cancel, params, context, deps });
                blockCancel.throwIfCancelled();

                if (resultBefore instanceof BaseBlock) {
                    resultBefore = await runContext.run({
                        block: resultBefore,
                        blockCancel: blockCancel.create(),
                        depsDomain: new DepsDomain(depsDomain),
                        params: params,
                        context: context,
                        cancel: cancel,
                        nParents: nParents + 1,
                    }) as BeforeResultOut;
                }
                blockCancel.throwIfCancelled();
            }

            if (resultBefore === undefined) {
                if (index < lifecycle.length - 1) {
                    resultBlock = await this.doLifecycleStep(
                        { index: index + 1, runContext, blockCancel, cancel, params, context, deps, nParents, depsDomain },
                    ) as BlockResult;

                } else {
                    resultBlock = await this.doAction({ runContext, blockCancel, cancel, params, context, deps, nParents, depsDomain });
                }
            }
            blockCancel.throwIfCancelled();

            if (typeof step.after === 'function') {
                resultAfter = await step.after({ cancel, params, context, deps, result: (resultBefore || resultBlock) as any });
                blockCancel.throwIfCancelled();

                if (resultAfter instanceof BaseBlock) {
                    resultAfter = await runContext.run({
                        block: resultAfter,
                        blockCancel: blockCancel.create(),
                        depsDomain: new DepsDomain(depsDomain),
                        params: params,
                        context: context,
                        cancel: cancel,
                        nParents: nParents + 1,
                    }) as AfterResultOut;
                }
                blockCancel.throwIfCancelled();
            }

        } catch (e) {
            const error = createError(e);

            //  FIXME: А нужно ли уметь options.error делать асинхронным?
            //
            if (typeof step.error === 'function') {
                errorResult = step.error({ cancel, params, context, deps, error });
            } else {
                throw error;
            }
        }

        let result;

        if (errorResult !== undefined) {
            result = errorResult;
        } else {
            if (resultBefore !== undefined) {
                result = resultBefore;
            } else if (typeof step.after === 'function') {
                result = resultAfter;
            } else {
                result = resultBlock;
            }
        }

        return result as InferResultOrResult<ResultOut>;
    }

    protected abstract blockAction({ runContext, blockCancel, cancel, params, context, deps, nParents, depsDomain }: {
        runContext: ContextClass<BlockResult, IntermediateResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult>

    private async doAction({
        runContext,
        blockCancel,
        cancel,
        params,
        context,
        deps,
        depsDomain,
        nParents,
    }: {
        runContext: ContextClass<
        BlockResult,
        IntermediateResult,
        ResultOut,
        Context,
        BeforeResultOut,
        AfterResultOut,
        ErrorResultOut
        >;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        let result: BlockResult | undefined = undefined;

        const cache = this.options.cache;
        let key;
        const optionsKey = this.options.key;

        if (cache && optionsKey) {
            //  Тут не нужен cancel.
            key = (typeof optionsKey === 'function') ? optionsKey({ params, context, deps }) : optionsKey;
            if (typeof key !== 'string') {
                key = null;
            }
            if (key) {
                try {
                    result = await cache.get({ key });

                } catch (e) {
                    //  Do nothing.
                }
                blockCancel.throwIfCancelled();

                if (result !== undefined) {
                    return result;
                }
            }
        }

        result = await this.blockAction({
            runContext,
            blockCancel,
            cancel,
            params,
            context,
            deps,
            nParents,
            depsDomain,
        });
        blockCancel.throwIfCancelled();

        if (result !== undefined && key && cache) {
            try {
                const promise = cache.set({
                    key: key,
                    value: result,
                    maxage: this.options.maxage,
                }) as unknown as object | Promise<unknown>;
                //  FIXME: А как правильно? cache.set может вернуть промис, а может и нет,
                //  при этом промис может зафейлиться. Вот так плохо:
                //
                //      await cache.set( ... )
                //
                //  так как ждать ответа мы не хотим. Но результат хотим проигнорить.
                //
                if (promise && 'catch' in promise && typeof promise.catch === 'function') {
                    //  It's catchable!
                    promise.catch(() => {
                        //  Do nothing.
                    });
                }

            } catch (e) {
                //  Do nothing.
            }
        }

        return result;
    }

}

//BaseBlock.prototype = Object.create(Function.prototype);

export default BaseBlock;

//  ---------------------------------------------------------------------------------------------------------------  //

function extendDeps(deps?: DescriptBlockId | DepsIds | null): DepsIds | null {
    if (!deps) {
        return null;
    }

    if (!Array.isArray(deps)) {
        deps = [ deps ];
    }

    return (deps.length) ? deps : null;
}
