import BaseBlock from './block';
import type { DescriptBlockDeps } from './depsDomain';
import DepsDomain from './depsDomain';
import { createError, ERROR_ID } from './error';
import type { BlockResultOut, DescriptBlockOptions, InferParamsOutFromBlock } from './types';
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
    Params = never extends InferParamsOutFromBlock<BlockResult> ? ParamsOut : InferParamsOutFromBlock<BlockResult>
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
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        //ExtendedCustomBlock = DescriptHttpBlockDescription<ExtendedParamsOut, Context, HttpResult>,

        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
    >({ options }: {
        options: DescriptBlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >;
    }) {
        return new FunctionBlock({
            block: this.extendBlock(this.block) as typeof this.block,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-expect-error
            options: this.extendOptions(this.options, options) as typeof options,
        });
    }
}

export default FunctionBlock;
