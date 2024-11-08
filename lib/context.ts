import type { DescriptError } from './error';
import { ERROR_ID, createError } from './error' ;

import BlockClass from './block' ;

import type { Deffered } from './getDeferred';
import getDeferred from './getDeferred';
import type { DescriptBlockId } from './depsDomain';
import type Cancel from './cancel';
import type DepsDomain from './depsDomain';
import type { BlockResultOut, InferResultOrResult } from './types';
import type BaseBlock from './block';

//  ---------------------------------------------------------------------------------------------------------------  //

type StoredResult<Result, Error> = {
    error: Error;
} | {
    result: Result;
}

type Dependency = {blockCancel: Cancel; nParents: number}

class RunContext<
    BlockResult,
    IntermediateResult,
    ResultOut extends BlockResultOut<BlockResult, BeforeResultOut, AfterResultOut, ErrorResultOut>,
    Context,
    BeforeResultOut = undefined,
    AfterResultOut = undefined,
    ErrorResultOut = undefined,
> {

    private nBlocks = 0;
    private nActiveBlocks = 0;

    private blockPromises: Record<DescriptBlockId, Deffered<ResultOut, DescriptError>> = {};
    private blockResults: Record<DescriptBlockId, StoredResult<ResultOut, DescriptError>> = {};

    private waitingForDeps: Array<Dependency> = [];

    getWaitingDeps() {
        return this.waitingForDeps;
    }

    addWaitingDeps(dep: Dependency) {
        this.waitingForDeps.push(dep);
    }
    removeWaitingDeps(blockCancel: Dependency['blockCancel']) {
        this.waitingForDeps = this.waitingForDeps.filter(item => item.blockCancel !== blockCancel);
    }

    getNumberOfBlocks() {
        return this.nBlocks;
    }

    incNumberOfBlocks() {
        return this.nBlocks++;
    }
    decNumberOfBlocks() {
        return this.nBlocks--;
    }

    getNumberOfActiveBlocks() {
        return this.nActiveBlocks;
    }

    incNumberOfActiveBlocks() {
        return this.nActiveBlocks++;
    }
    decNumberOfActiveBlocks() {
        return this.nActiveBlocks--;
    }

    getPromise(id: DescriptBlockId) {
        let deferred = this.blockPromises[ id ];
        if (!deferred) {
            const result = this.blockResults[ id ];

            if (result) {
                if ('error' in result) {
                    return Promise.reject(result.error);

                } else {
                    return Promise.resolve(result.result);
                }
            }

            deferred = this.blockPromises[ id ] = getDeferred<ResultOut, DescriptError>();
        }

        return deferred.promise;
    }

    resolvePromise(id: DescriptBlockId, result: ResultOut) {
        this.blockResults[ id ] = {
            result: result,
        };

        const deferred = this.blockPromises[ id ];

        if (deferred) {
            deferred.resolve(result);
        }
    }

    rejectPromise(id: DescriptBlockId, error: DescriptError) {
        this.blockResults[ id ] = {
            error: error,
        };

        const deferred = this.blockPromises[ id ];
        if (deferred) {
            deferred.reject(error);
        }
    }

    async run<
        CustomBlock,
        ParamsOut,
        Params = ParamsOut,
    >(
        { block, blockCancel, depsDomain, params, context, cancel, prev, nParents = 0 }:
        {
            block: BaseBlock<Context,
            CustomBlock,
            ParamsOut,

            ResultOut,
            IntermediateResult,
            BlockResult,

            BeforeResultOut,
            AfterResultOut,
            ErrorResultOut,
            Params
            >;
            blockCancel: Cancel;
            depsDomain?: DepsDomain;
            params?: Params;
            context?: Context;
            cancel: Cancel;
            prev?: unknown;
            nParents?: number;
        }): Promise<InferResultOrResult<ResultOut>> {
        //  FIXME: А может block быть промисом?
        if (block instanceof BlockClass) {
            //  На тот случай, когда у нас запускается один блок и у него сразу есть зависимости.
            this.queueDepsCheck();

            const blockResult = await block.run({
                runContext: this,
                blockCancel: blockCancel,
                depsDomain: depsDomain,
                params: params,
                context: context,
                cancel: cancel,
                prev: prev,
                nParents: nParents,
            });
            blockCancel.throwIfCancelled();

            return blockResult as Promise<InferResultOrResult<ResultOut>>;

        } else {
            blockCancel.close();
        }

        return block as Promise<InferResultOrResult<ResultOut>>;
    }

    queueDepsCheck() {
        process.nextTick(() => {
            if (this.waitingForDeps.length > 0) {
                this.waitingForDeps.forEach(({ blockCancel, nParents }) => {
                    if (this.nBlocks > 0 && this.nActiveBlocks <= nParents) {
                        //  console.log( 'DEPS FAILED', this.nBlocks, this.nActiveBlocks, nParents );
                        const error = createError(ERROR_ID.DEPS_NOT_RESOLVED);
                        blockCancel.cancel(error);
                    }
                });
            }
        });
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

export default RunContext;
