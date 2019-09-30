# `options.required`

Применимо только к подблокам [de.array](./array_block.md) и [de.object](./object_block.md).

```js
const block = de.object( {
    block: {

        foo: block_foo,

        bar: block_bar( {
            options: {
                required: true,
            },
        } ),

    },
} );
```

Если в процессе выполнения этого блока `block_foo` завершится ошибкой, а `block_bar` нет,
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

Т.е. несмотря на ошибку в `block_foo`, сам блок `block` завершится удачно.

Если же теперь наоборот, `block_foo` завершается успешно, а `block_bar` ошибкой.
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

