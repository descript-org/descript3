import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn {
    id: string;
}
interface ParamsOut {
    s1: string;
}
interface ResultIn {
    result: string;
}
interface ResultOut {
    foo: string;
}

const block_1 = de.func( {
    block: ( { params, context, generate_id } ) => {
        //  Здесь нужно вернуть тот же тип, что указан в after в качестве входящего результата.
        //  Если after нет, то можно ничего не указывать, все выведется.
        return {
            result: params.s1,
        };
    },
    options: {
        params: ( { params }: { params: ParamsIn, context: Context } ): ParamsOut => {
            return {
                s1: params.id,
            };
        },

        //  Важно!!!
        //  Необходимо задать тип входящего result'а именно здесь.
        //  Почему-то этот тип не берется из результата функции из block.
        //
        after: ( { params, result }: { params: ParamsOut, result: ResultIn } ) => {
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

