import * as de from '../../lib';
import type { DescriptHttpBlockResult } from '../../lib/types';

const block1 = de.http({
    block: {},
    options: {
        //TODO как указать тип blockResult?
        after: ({ result }: { result: DescriptHttpBlockResult<string> }) => {
            if (de.isError(result)) {
                return result.error.id;
            } else {
                return result.result.slice(0, 10);
            }
        },
    },
});

block1;
