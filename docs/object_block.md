# `de.object`

Это блок (Как и [de.array](./array_block.md)) позволяет строить более сложные блоки
из других блоков:

```js
import blockFoo from '.../blocks/foo';
import blockBar from '.../blocks/bar';
...

const block = de.object( {

    block: {
        foo: blockFoo,
        bar: blockBar,
        ...
    },

} );
```

Когда мы запускаем `de.object`, запускаются все его непосредственные подблоки (`blockFoo`, `blockBar`, ...)
и из их результатов составляется результат `de.object`'а:

```js
const result = {
    //  Результат работы blockFoo
    foo: resultFoo,
    //  Результат работы blockBar
    bar: resultBar,
    ...
};
```

Т.е. форма результата будет такая же, как и форма объекта в определении `de.object`.


## Ошибки

Если какой-то из подблоков завершится ошибкой, это не будет значить, что и `de.object` завершится ошибкой.
Просто в `result` мы получим что-то такое:

```js
const result = {
    //  Ошибка blockFoo
    foo: errorFoo,
    //  Результат работы blockBar
    bar: resultBar,
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
        foo: blockFoo( {
            options: {
                required: true,
            },
        } ),
        bar: blockBar,
        ...
    },

} );
```

## Вложенные `de.object`

В качестве подблоков у `de.object` могут быть любые блоки, в том числе и другие `de.object`:

```js
const block = de.object( {
    block: {
        foo: blockFoo,
        bar: de.object( {
            block: {
                quu: blockQuu,
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
    foo: resultFoo,
    bar: {
        quu: resultQuu,
        ...
    },
    ...
};
```


## Зависимости

Часто нужно подблоки запускать не все сразу, а в некотором определенном порядке.
Чтобы можно было использовать результат работы одних подблоков для запуска других подблоков.
Для этого существует механизм [зависимостей](./deps.md).

