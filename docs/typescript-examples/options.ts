import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  Это параметры, которые приходят в блок извне.
//
interface ParamsExt {
    id: string;
}

//  Это вычисленные параметры, которые блок использует внутри.
//  В колбэки before, after и т.д. будут приходить вот эти параметры.
//
interface ParamsInt {
    foo: string;
}

//  Это необработанный результат.
//
interface ResultRaw {
    a: string;
}

//  ---------------------------------------------------------------------------------------------------------------  //

//  Вариант 1.

//  * Вычисляем новые параметры.
//  * Обрабатываем результат.
//  * Используем вычисленные параметры.

const block1 = de.http( {
    block: {},
    options: {
        //  Имеет смысл сделать явный интерфейс для вычисленных параметров.
        //  Это нужно, если, скажем, в after нужны будут эти параметры.
        //  Если мы просто вернем что-то из options.params, то мы не сможем потом объяснить options.after,
        //  что же за params в него пришли.
        //
        //  Если нам где-то вообще понадобится context, то лучше всего задать его тип здесь.
        //
        params: ( { params, context }: { params: ParamsExt, context: Context } ): ParamsInt => {
            return {
                foo: params.id,
            };
        },

        //  Тут тип params уже ParamsInt.
        //
        before: ( { params, context } ) => {
            if ( !params.foo ) {
                //  Мы можем вернуть тот же тип, что возвращает options.after.
                return 'foo';
            }

            //  Или же ничего не возвращать.
        },

        //  Тут мы задаем тип сырого результата.
        //  Если мы здесь хотим использовать params, то нам приходится прописать тип явно.
        //  Typescript не позволяет частично задавать тип при destructure.
        //
        after: ( { params, result }: { params: ParamsInt, result: ResultRaw } ) => {
            //  Тип для обработанного результата нам в принципе не нужен.
            //  Он выведется из того, что мы вернули.
            //
            return result.a;
        },
    },
} );

de.run( block1, {
    params: {
        id: '12345',
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );

    //  ---------------------------------------------------------------------------------------------------------------  //

//  Вариант 2.

//  * Вычисляем новые параметры.
//  * Обрабатываем результат, но params нам в after не нужны.

const block2 = de.http( {
    block: {},
    options: {
        //  Не объявляем тип ParamsInt, он выведется из того, что мы вернем из options.params.
        //
        params: ( { params, context }: { params: ParamsExt, context: Context } ) => {
            return {
                foo: params.id,
            };
        },

        before: ( { params } ) => {
            if ( !params.foo ) {
                return 'foo';
            }
        },

        after: ( { result }: { result: ResultRaw } ) => {
            return result.a;
        },
    },
} );

de.run( block2, {
    params: {
        id: '12345',
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );

//  ---------------------------------------------------------------------------------------------------------------  //

//  Вариант 3.

//  * Не вычисляем новые параметры.

const block3 = de.http( {
    block: {},
    options: {
        before: ( { params } ) => {
            if ( !params.id ) {
                return 'foo';
            }
        },

        //  Где-то нужно объявить тип входящих params.
        //  Например, в after. Или же в before. В зависимости от того, что есть.
        //
        after: ( { params, result }: { params: ParamsExt, result: ResultRaw } ) => {
            return result.a;
        },
    },
} );

de.run( block3, {
    params: {
        id: '12345',
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );
