import * as de from "../../lib";
import {DescriptError} from "../../lib";

interface ResultRaw {
    result: string | DescriptError
}

const block1 = de.http( {
    block: {},
    options: {
        after: ( { result }: ResultRaw ): string => {
            if (de.is_error(result)) {
                return result.error.id;
            } else{
                return result.slice(0, 10);
            }
        },
    },
} );
