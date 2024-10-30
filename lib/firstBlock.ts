import CompositeBlock from './compositeBlock' ;
import { ERROR_ID, createError } from './error';
import type { DescriptError } from './error';
import type BaseBlock from './block';
import type {
    BlockResultOut,
    First,
    InferResultFromBlock,
    InferParamsInFromBlock,
    Tail,
    DescriptBlockOptions,
} from './types';

import type ContextClass from './context';
import type Cancel from './cancel';
import type { DescriptBlockDeps } from './depsDomain';
import type DepsDomain from './depsDomain';

type GetFirstBlockParamsMap< T extends ReadonlyArray<unknown>> = {
    [ P in keyof T ]: InferParamsInFromBlock<T[ P ]>;
}

export type GetFirstBlockParamsUnion< T extends ReadonlyArray<unknown>> = {
    0: never;
    1: First< T >;
    2: First< T > & GetFirstBlockParamsUnion< Tail< T > >;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetFirstBlockParams<
    T extends ReadonlyArray<unknown>,
    PA extends ReadonlyArray<unknown> = GetFirstBlockParamsMap<T>,
    PU = GetFirstBlockParamsUnion<PA>
> = PU;


type GetFirstBlockResultMap< T extends ReadonlyArray<unknown>> = {
    [ P in keyof T ]: InferResultFromBlock<T[ P ]>;
}

type GetFirstBlockResultUnion< T extends ReadonlyArray<unknown>> = {
    0: never;
    1: First< T > | DescriptError;
    2: First< T > | DescriptError | GetFirstBlockResultUnion< Tail< T > >;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetFirstBlockResult<
    T extends ReadonlyArray<unknown>,
    PA extends ReadonlyArray<unknown> = GetFirstBlockResultMap<T>,
    PU = GetFirstBlockResultUnion<PA>
> = PU;

export type FirstBlockDefinition< T > = {
    [ P in keyof T ]: T[ P ] extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
    > ? T[ P ] : never
}

class FirstBlock<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetFirstBlockParams<Block>,
    BlockResult = GetFirstBlockResult<Block>,

    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetFirstBlockParams<Block>,
> extends CompositeBlock<
    Context,
    FirstBlockDefinition<Block>,
    ParamsOut,
    ResultOut,
    BlockResult,
    BlockResult,

    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params
    > {

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
        FirstBlock<
        Context,
        Block,
        ExtendedResultOut,
        Params & ExtendedParamsOut,
        ExtendedBlockResult,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut,
        ExtendedParams
        >,
        ExtendedBlockResult,
        ExtendedParamsOut,
        ExtendedParams,
        ExtendedBeforeResultOut,
        ExtendedAfterResultOut,
        ExtendedErrorResultOut
        >({ options });
    }

    protected initBlock(block: FirstBlockDefinition<Block>) {
        if (!Array.isArray(block)) {
            throw createError({
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an array',
            });
        }

        super.initBlock(block);
    }

    protected async blockAction({ runContext, blockCancel, cancel, params, context, nParents, depsDomain }: {
        runContext: ContextClass<BlockResult, BlockResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        let prev: Array<DescriptError> = [];

        for (let i = 0; i < this.block.length; i++) {
            const block = this.block[ i ];

            try {
                const result = await runContext.run({
                    block: block,
                    blockCancel: blockCancel.create(),
                    depsDomain,
                    params: params,
                    context: context,
                    cancel: cancel,
                    prev: prev,
                    nParents: nParents + 1,
                });

                return result as Promise<BlockResult>;

            } catch (e) {
                prev = prev.concat(e);
            }
        }

        throw createError({
            id: ERROR_ID.ALL_BLOCKS_FAILED,
            reason: prev,
        });
    }
}

export default FirstBlock;
