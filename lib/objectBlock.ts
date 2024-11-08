import CompositeBlock from './compositeBlock';
import type { DescriptError } from './error';
import { createError, ERROR_ID } from './error';
import type BaseBlock from './block';
import type { InferParamsInFromBlock, DescriptBlockOptions, BlockResultOut, UnionToIntersection, InferResultFromBlock } from './types';
import type ContextClass from './context';
import type Cancel from './cancel';
import type { DescriptBlockDeps } from './depsDomain';
import type DepsDomain from './depsDomain';


export type InferResultFromObjectBlocks<Block> = Block extends BaseBlock<
// eslint-disable-next-line @typescript-eslint/no-unused-vars
infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer IntermediateResult,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
infer BlockResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
> ?
    { [ K in keyof BlockResult ]: InferResultFromObjectBlocks<BlockResult[K]> } :
    Block;

export type GetObjectBlockResult< T extends Record<string, any> > = {
    [ P in keyof T ]: InferResultFromBlock<T[P]> | DescriptError
}

export type GetObjectBlockParams<
    T extends Record<string, any>,
    PB = GetObjectBlockParamsMap< T >,
> = UnionToIntersection<PB[ keyof PB ]>


type GetObjectBlockParamsMap< T extends Record<string, any> > = {
    [ P in keyof T ]: unknown extends InferParamsInFromBlock<T[ P ]> ? object : InferParamsInFromBlock<T[ P ]>;
}


export type ObjectBlockDefinition< T extends Record<string, any> > = {
    [ P in keyof T ]: T[ P ] extends BaseBlock<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer Context, infer CustomBlock, infer ParamsOut, infer ResultOut, infer BlockResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer IntermediateResult, infer BeforeResultOut, infer AfterResultOut, infer ErrorResultOut, infer Params
    > ? T[ P ] : never
}

class ObjectBlock<
    Context,
    Blocks extends Record<string, any>,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    ParamsOut = GetObjectBlockParams<Blocks>,
    BlockResult = GetObjectBlockResult<Blocks>,

    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = GetObjectBlockParams<Blocks>,
> extends CompositeBlock<
    Context,
    ObjectBlockDefinition<Blocks>,
    ParamsOut,
    ResultOut,
    BlockResult,
    BlockResult,

    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params
    > {

    protected initBlock(object: ObjectBlockDefinition<Blocks>) {
        if (!(object && typeof object === 'object')) {
            throw createError({
                id: ERROR_ID.INVALID_BLOCK,
                message: 'block must be an object',
            });
        }

        super.initBlock(object);

        this.blocks = Object.keys(object).reduce((ret, key) => {
            const block = object[key];

            ret.push({
                block,
                key,
            });
            return ret;
        }, [] as typeof this.blocks);
    }

    protected async blockAction(args: {
        runContext: ContextClass<BlockResult, BlockResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context: Context;
        deps: DescriptBlockDeps;
        nParents: number;
        depsDomain?: DepsDomain;
    }): Promise<BlockResult> {
        const results = await this.runBlocks(args);

        const r: Record<string, unknown> = {};
        const blocks = this.blocks;
        results.forEach((result, i) => {
            r[ blocks[ i ].key ] = result;
        });
        return r as unknown as Promise<BlockResult>;
    }

    extend<
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ExtendedResultOut extends
        BlockResultOut<ExtendedBlockResult, ExtendedBeforeResultOut, ExtendedAfterResultOut, ExtendedErrorResultOut>,
        //ExtendedCustomBlock extends ObjectBlockDefinition<Blocks>,
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
        return new ObjectBlock({
            block: this.extendBlock(this.block),
            options: this.extendOptions(this.options, options) as typeof options,
        });
    }

}

export default ObjectBlock;
