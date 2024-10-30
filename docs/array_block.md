# `de.array`

Это блок (Как и [de.object](./object_block.md)) позволяет строить более сложные блоки
из других блоков:

```js
const blockFoo = require( '.../blocks/foo' );
const blockBar = require( '.../blocks/bar' );
...

const block = de.array( {

    block: [
        blockFoo,
        blockBar,
        ...
    ],

} );
```

Когда мы запускаем `de.array`, запускаются все его непосредственные подблоки (`blockFoo`, `blockBar`, ...)
и из их результатов составляется результат `de.array`'а:

```js
const result = [
    //  Результат работы blockFoo
    resultFoo,
    //  Результат работы blockBar
    resultBar,
    ...
];
```

На выходе получаем массив, составленных из результатов работы подблоков.
В том же порядке, что и подблоки в определении `de.array`.


## Ошибки

Если какой-то из подблоков завершится ошибкой, это не будет значить, что и `de.array` завершится ошибкой.
Просто в `result` мы получим что-то такое:

```js
const result = [
    //  Ошибка blockFoo
    errorFoo,
    //  Результат работы blockBar
    resultBar,
    ...
];
```

## `options.required`

Если мы таки хотим, чтобы при ошибке какого-то подблока, и сам `de.array` завершался ошибкой,
можно использовать `options.required`:

```js
const block = de.array( {

    block: [
        //  Если этот блок зафейлится, то и весь de.array так же зафейлится.
        blockFoo.extend( {
            options: {
                required: true,
            },
        } ),
        blockBar,
        ...
    ],

} );
```

## Вложенные `de.array`

В качестве подблоков у `de.array` могут быть любые блоки, в том числе и другие `de.array`:

```js
const block = de.array( {
    block: [
        blockFoo,
        de.array( {
            block: [
                blockQuu,
                ...
            ],
        } ),
        ...
    ],
} );
```

Соответственно, в результате мы получим объект с такой же формой:

```js
const result = [
    resultFoo,
    [
        resultQuu,
        ...
    ],
    ...
];
```


## Зависимости

Часто нужно подблоки запускать не все сразу, а в некотором определенном порядке.
Чтобы можно было использовать результат работы одних подблоков для запуска других подблоков.
Для этого существует механизм [зависимостей](./deps.md).

