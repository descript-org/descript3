import BaseBlock from './block' ;
import type { DescriptError } from './error';
import { ERROR_ID, createError } from './error' ;
import type { BlockResultOut, InferResultFromBlock } from './types';
import type ContextClass from './context';
import type Cancel from './cancel';
import type DepsDomain from './depsDomain';

type ArrayResults< T > = {
    [ P in keyof T ]: T[P] extends {
        key: number | string;
        block: infer B;
    } ?
        InferResultFromBlock<B>
        :
        never
}

abstract class CompositeBlock<
    Context,
    CustomBlock,
    ParamsOut,
    ResultOut extends BlockResultOut<BlockResultInt, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    IntermediateResult,
    BlockResultInt,

    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
    Params = ParamsOut
> extends BaseBlock<
    Context,
    CustomBlock,
    ParamsOut,
    ResultOut,
    IntermediateResult,
    BlockResultInt,

    BeforeResultOut,
    AfterResultOut,
    ErrorResultOut,
    Params
    > {

    protected blocks: Array<{
        key: string | number;
        block: BaseBlock<
        Context, CustomBlock, ParamsOut, ResultOut, IntermediateResult, BlockResultInt, BeforeResultOut, AfterResultOut, ErrorResultOut, Params
        >;
    }>;

    protected runBlocks({ runContext, blockCancel, cancel, params, context, nParents, depsDomain }: {
        runContext: ContextClass<BlockResultInt, IntermediateResult, ResultOut, Context, BeforeResultOut, AfterResultOut, ErrorResultOut>;
        blockCancel: Cancel;
        cancel: Cancel;
        params: ParamsOut;
        context?: Context;
        nParents: number;
        depsDomain?: DepsDomain;
    }) {
        const promises = this.blocks.map(({ block, key }) => {
            return runContext.run({
                block: block,
                blockCancel: blockCancel.create(),
                depsDomain: depsDomain,
                params: params as unknown as Params,
                context: context,
                cancel: cancel,
                nParents: nParents + 1,
            })
                .catch((error) => {
                    if (block.isRequired()) {
                        error = createError({
                            id: ERROR_ID.REQUIRED_BLOCK_FAILED,
                            path: getErrorPath(key, error),
                            reason: error,
                        });
                        blockCancel.cancel(error);

                        throw error;
                    }

                    return error;
                });
        });

        return Promise.race([
            Promise.all(promises),
            blockCancel.getPromise(),
        ]) as Promise<ArrayResults<typeof this.blocks>>;
    }

    /*
    block_action_started_in_context( run_context ) {
        //  Do nothing.
        //  console.log( 'composite.block_action_started_in_context', run_context._n_blocks, run_context._n_active_blocks );
    }

    block_action_stopped_in_context( context ) {
        //  Do nothing.
        //  console.log( 'composite.block_action_stopped_in_context', run_context._n_blocks, run_context._n_active_blocks );
    }
    */
}

function getErrorPath(key: number | string, error: DescriptError) {
    let r = (typeof key === 'number') ? `[ ${ key } ]` : `.${ key }`;

    const path = error.error.path;
    if (path) {
        r += path;
    }

    return r;
}

export default CompositeBlock;
