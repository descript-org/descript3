# Миграция `v2` -> `v3`

## Работа с зависимостями. Было

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

//  de.object статический.
//
module.exports = de.object( {
    block: {
        foo: block_foo( {
            options: {
                //  Используем обычные строки в качестве id.
                //
                id: 'foo',
            },
            select: {
                //  Достаем из результата значение
                //  и кладем его в state.bar.
                //
                bar: de.jexpr( '.bar' ),
            },
        } ),

        bar: block_bar( {
            options: {
                deps: 'foo',

                params: ( params, context, state ) => {
                    return {
                        //  Достаем значение из стейта.
                        //
                        bar: state.bar,
                    };
                },
            },
        } ),
    },
};
```


## Работа с зависимостями. Стало

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

//  Оборачиваем все в специальное замыкание.
//  Чтобы получить генератор id-шников.
//
module.exports = function( { get_id } ) {
    //  Не исользуем строки в качестве id,
    //  генерим id специальной функцией.
    //
    const id = get_id();

    //  de.object создается динамически.
    //  Блоки внутри него связываются только внутри этого замыкания.
    //  Снаружи id не доступен.
    //
    return de.object( {
        block: {
            foo: block_foo( {
                options: {
                    id: id,
                },
                //  Тут ничего специально не делаем.
                //  options.select больше нет, равно как и стейта.
            } ),

            bar: block_bar( {
                options: {
                    deps: id,

                    //  Результат выполнения зависимостей приходит
                    //  в колбэк в поле deps.
                    params: ( { deps } ) => {
                        //  По id достаем результат нужного блока.
                        const result_foo = deps[ id ];

                        return {
                            bar: result_foo.bar,
                        };
                    },
                },
            } ),
        },
    } );
};
```


## Работа с параметрами. Было

```js
module.exports = de.http( {
    block: {
        path: de.jstring( '/1.0/foo/{ params.foo }' ),
        query: {
            bar: null,
        },
        headers: {
            'content-type': 'application/json',
        },
        body: ( params ) => {
            return {
                quu: params.quu,
            },
        },
    },

    options: {
        valid_params: {
            foo: null,
            bar: null,
            quu: null,
        },
    },
} );
```


## Работа с параметрами. Стало

```js
module.exports = de.http( {
    block: {
        path: de.jstring( '/1.0/foo/{ params.foo }' ),
        query: {
            bar: null,
        },
        headers: {
            'content-type': 'application/json',
        },
        body: ( { params } ) => {
            return {
                quu: params.quu,
            },
        },
    },
    //  options.valid_params не нужны и их больше нет.
} );
```

