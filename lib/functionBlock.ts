import BaseBlock from './block';
import type { DescriptBlockDeps } from './depsDomain';
import DepsDomain from './depsDomain';
import { createError, ERROR_ID } from './error';
import type { BlockResultOut, DescriptBlockOptions } from './types';
import type ContextClass from './context';
import type Cancel from './cancel';

export type FunctionBlockDefinition<
    Context,
    Params,
    BlockResult,
> = (args: {
    params: Params;
    context: Context;
    deps: DescriptBlockDeps;
    generateId: DepsDomain['generateId'];
    cancel: Cancel;
    blockCancel: Cancel;
}) => Promise<BlockResult> | BlockResult;

class FunctionBlock<
    Context,
    ParamsOut,
    BlockResult,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = ParamsOut
> extends BaseBlock<
    Context,
    FunctionBlockDefinition<Context, ParamsOut, BlockResult>,
    ParamsOut,
    ResultOut,
    BlockResult,
    BlockResult,

    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params
    > {

    protected initBlock(block: FunctionBlockDefinition<Context, ParamsOut, BlockResult>) {
        if (typeof block !== 'function') {
            throw createError({
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be a function',
            });
        }

        super.initBlock(block);
    }

    protected async blockAction({ runContext, blockCancel, cancel, params, context, deps, nParents, depsDomain }: {
        runContext: ContextClass<BlockResult, BlockResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        depsDomain = new DepsDomain(depsDomain);

        const result = await Promise.race([
            this.block({
                blockCancel: blockCancel,
                cancel: cancel,
                params: params,
                context: context,
                deps: deps,
                generateId: depsDomain.generateId,
            }),
            blockCancel.getPromise(),
        ]) as BlockResult;

        if (result instanceof BaseBlock) {
            return await runContext.run({
                block: result,
                blockCancel: blockCancel.create(),
                depsDomain: depsDomain,
                cancel: cancel,
                params: params,
                context: context,
                nParents: nParents + 1,
            }) as BlockResult;
        }

        return result;
    }

    extend<
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ExtendedResultOut extends
        BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        ExtendedParamsOut = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
    >({ options }: {
        options: DescriptBlockOptions<
        Context, Params & ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >;
    }) {
        return this.extendClass<
        FunctionBlock<
        Context,
        //FNBlock,
        //FunctionBlockDefinition<Context, Params & ExtendedParamsOut, BlockResult>,
        Params & ExtendedParamsOut,
        ExtendedBlockResult,
        ExtendedResultOut,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut,
        ExtendedParams
        >,
        ExtendedBlockResult,
        Params & ExtendedParamsOut,
        ExtendedParams,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut
        >({ options });
    }
}

export default FunctionBlock;
