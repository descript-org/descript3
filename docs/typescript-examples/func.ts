import {DescriptBlockParams, DescriptBlockResult, DescriptBlockResultJSON} from '../../lib';
import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn1 {
    id: string;
}
interface ParamsOut {
    s1: string;
}
type ResultIn = string;

interface ResultOut {
    foo: string;
}

const block_1 = de.func<Context, DescriptBlockParams<ParamsIn1, ParamsIn1, ParamsOut>, DescriptBlockResult<DescriptBlockResultJSON<ResultIn>, ResultOut>>( {
    block: ( { params, context, generate_id } ) => {
        //  Здесь нужно вернуть тот же тип, что указан в after в качестве входящего результата.
        //  Если after нет, то можно ничего не указывать, все выведется.
        return {
            result: params.s1,
        };
    },
    options: {
        params: ( { params } ) => {
            return {
                s1: params.id,
            };
        },

        //  Важно!!!
        //  Необходимо задать тип входящего result'а именно здесь.
        //  Почему-то этот тип не берется из результата функции из block.
        //
        after: ( { params, result }) => {
            console.log( params );
            return {
                foo: result.result,
            }
        },
    },
} );

de.run( block_1, {
    params: {
        id: 'foo',
    },
} )
    .then( ( result ) => {
        console.log( result );
    });

const block_2 = de.func<Context, never, DescriptBlockResult<ResultOut, string>>({
    block: () => {
        const result = { foo: 'bar' };
        return Promise.resolve(result);
    },
    options: {
        after: ({ result }): string => {
            return result.foo;
        },
    },
});

de.run( block_2, {} )
    .then( ( result ) => {
        console.log( result );
    });
