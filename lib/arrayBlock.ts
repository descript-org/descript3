import CompositeBlock from './compositeBlock' ;
import { createError, ERROR_ID } from './error' ;
import type { DescriptError } from './error' ;
import type {
    BlockResultOut,
    First,
    InferResultFromBlock,
    InferParamsInFromBlock,
    Tail,
    DescriptBlockOptions,
} from './types';
import type BaseBlock from './block';
import type ContextClass from './context';
import type Cancel from './cancel';
import type { DescriptBlockDeps } from './depsDomain';
import type DepsDomain from './depsDomain';

export type GetArrayBlockResult< T extends ReadonlyArray<unknown>> = {
    0: never;
    1: [ InferResultFromBlock< First< T > > | DescriptError ];
    2: [ InferResultFromBlock< First< T > > | DescriptError, ...GetArrayBlockResult< Tail< T > > ];
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

export type GetArrayBlockParamsUnion< T extends ReadonlyArray<unknown>> = {
    0: never;
    1: First< T >;
    2: First< T > & GetArrayBlockParamsUnion< Tail< T > >;
}[ T extends [] ? 0 : T extends ((readonly [ any ]) | [ any ]) ? 1 : 2 ];

type GetArrayBlockParamsMap< T extends ReadonlyArray<unknown>> = {
    [ P in keyof T ]: InferParamsInFromBlock<T[ P ]>;
}

export type GetArrayBlockParams<
    T extends ReadonlyArray<unknown>,
    PA extends ReadonlyArray<unknown> = GetArrayBlockParamsMap<T>,
    PU = GetArrayBlockParamsUnion<PA>
> = PU;

export type ArrayBlockDefinition< T > = {
    [ P in keyof T ]: T[ P ] extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
    > ? T[ P ] : never
}

class ArrayBlock<
    Context,
    Block extends ReadonlyArray<unknown>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetArrayBlockParams<Block>,
    BlockResult = GetArrayBlockResult<Block>,

    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetArrayBlockParams<Block>,
> extends CompositeBlock<
    Context,
    ArrayBlockDefinition<Block>,
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
        ExtendedParamsOut extends Params = Params,
        ExtendedParams = Params,
        ExtendedBlockResult = ResultOut,
        ExtendedBeforeResultOut = undefined,
        ExtendedAfterResultOut = undefined,
        ExtendedErrorResultOut = undefined,
    >({ options }: {
        options: DescriptBlockOptions<
        Context, ExtendedParamsOut, ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut, ExtendedParams
        >;
    }) {
        return new ArrayBlock({
            block: this.extendBlock(this.block),
            options: this.extendOptions(this.options, options) as typeof options,
        });
    }

    protected initBlock(array: ArrayBlockDefinition<Block>) {
        if (!Array.isArray(array)) {
            throw createError({
                name: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an array',
            });
        }

        super.initBlock(array);

        this.blocks = array.map((block, i) => {
            return {
                block: block,
                key: i,
            };
        });
    }

    //  Сюда еще приходят deps последним параметром, но они не нужны здесь.
    //
    protected blockAction(args: {
        runContext: ContextClass<BlockResult, BlockResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        return this.runBlocks(args) as Promise<BlockResult>;
    }

}

export default ArrayBlock;
