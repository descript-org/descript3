# `de.func`

Блок для сложных, динамических, условных и т.д. операций.

```js
const block = de.func( {

    block: ( { params, context, deps, cancel } ) => {
        ...

        return ...;
    },

    options: ...,

} );
```

## Результат работы экшена

Экшен блока (функция из `block`) может:

  * Вернуть другой блок. В этом случае это блок будет выполнен с теми же аргументами (`params`, ...) и его результат и будет
    считаться результатом работы function-блока.

  * Вернуть промис. В этом случае мы ждем, пока промис зарезолвится/реджектится и это и будет результат работы блока.

  * Вернуть все остальное. Тогда это сразу и будет результатом работы блока.

  * Кинуть ошибку. Это значит блок завершится этой ошибкой.


```js
const anotherBlock = require( '...' );

const block = de.func( {

    block: ( { params } ) => {
        if ( !params.id ) {
            throw de.error( {
                id: 'INVALID_PARAMS',
            } );
        }

        if ( params.bar ) {
            return {
                bar: params.bar,
            };
        }

        if ( params.foo ) {
            return anotherBlock;
        }

        return new Promise( ( resolve ) => {
            ...
        } );
    },

} );
```


## Сокращенная версия

Если нам не нужно менять `options`, можно использовать не `de.func`,
а просто функцию:

```js
const block = ( { params } ) => {
    return ( params.foo ) ? blockFoo : blockBar;
};
```


## `generateId`

И в `de.func`, и в сокращенную версию блока приходит
функция `generateId`, чтобы устанавливать [зависимости](./deps.md) между блоками.

```js
const block = de.func( {
    block: ( { params, generateId } ) => {
        const id = generateId();

        ...
    },
} );

const block = ( { params, generateId } ) => {
    const id = generateId();

    ...
};
```
