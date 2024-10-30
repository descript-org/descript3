# `options.required`

Применимо только к подблокам [de.array](./array_block.md) и [de.object](./object_block.md).

```js
const block = de.object( {
    block: {

        foo: blockFoo,

        bar: blockBar.extend( {
            options: {
                required: true,
            },
        } ),

    },
} );
```

Если в процессе выполнения этого блока `blockFoo` завершится ошибкой, а `blockBar` нет,
то результатом работы `block` будет что-то типа:

```js
{
    foo: {
        error: {
            id: 'SOME_ERROR',
        },
    },
    bar: {
        //  Some result.
        bar: 24,
    },
}
```

Т.е. несмотря на ошибку в `blockFoo`, сам блок `block` завершится удачно.

Если же теперь наоборот, `blockFoo` завершается успешно, а `blockBar` ошибкой.
В этом случае, блок `block` тоже завершится вот такой ошибкой:

```js
{
    error: {
        id: de.ERROR_ID.REQUIRED_BLOCK_FAILED,
        //  Эта строчка показывает нам, кто именно из подблоков завершился ошибкой.
        path: '.bar',
        //  Это та самая ошибка в required-блоке, из-за которой весь de.object упал с ошибкой.
        reason: {
            error: {
                id: 'SOME_ERROR',
            },
        },
    },
}
```

Таким образом, чтобы `de.object` или `de.array` успешно завершились, необходимо (но, очевидно, не достаточно),
чтобы все required-блоки завершились успешно.

