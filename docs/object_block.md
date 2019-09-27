# `de.object`

Это блок (Как и [de.array](./array_block.md)) позволяет строить более сложные блоки
из других блоков:

```js
const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );
...

const block = de.object( {

    block: {
        foo: block_foo,
        bar: block_bar,
        ...
    },

} );
```

Когда мы запускаем `de.object`, запускаются все его непосредственные подблоки (`block_foo`, `block_bar`, ...)
и из их результатов составляется результат `de.object`'а:

```js
const result = {
    //  Результат работы block_foo
    foo: result_foo,
    //  Результат работы block_bar
    bar: result_bar,
    ...
};
```

Т.е. форма результата будет такая же, как и форма объекта в определении `de.object`.


## Ошибки

Если какой-то из подблоков завершится ошибкой, это не будет значить, что и `de.object` завершится ошибкой.
Просто в `result` мы получим что-то такое:

```js
const result = {
    //  Ошибка block_foo
    foo: error_foo,
    //  Результат работы block_bar
    bar: result_bar,
    ...
};
```

## `options.required`

Если мы таки хотим, чтобы при ошибке какого-то подблока, и сам `de.object` завершался ошибкой,
можно использовать `options.required`:

```js
const block = de.object( {

    block: {
        //  Если этот блок зафейлится, то и весь de.object так же зафейлится.
        foo: block_foo( {
            options: {
                required: true,
            },
        } ),
        bar: block_bar,
        ...
    },

} );
```

## Вложенные `de.object`

В качестве подблоков у `de.object` могут быть любые блоки, в том числе и другие `de.object`:

```js
const block = de.object( {
    block: {
        foo: block_foo,
        bar: de.object( {
            block: {
                quu: block_quu,
                ...
            },
        } ),
        ...
    },
} );
```

Соответственно, в результате мы получим объект с такой же формой:

```js
const result = {
    foo: result_foo,
    bar: {
        quu: result_quu,
        ...
    },
    ...
};
```


## Зависимости

Часто нужно подблоки запускать не все сразу, а в некотором определенном порядке.
Чтобы можно было использовать результат работы одних подблоков для запуска других подблоков.
Для этого существует механизм [зависимостей](./deps.md).

