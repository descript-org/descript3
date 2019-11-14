# `de.pipe`

Иногда нужно выполнить несколько блоков последовательно, передавая результат предыдущего блока в следующий.

```js
const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );
const block_quu = require( '.../blocks/quu' );

const block = de.pipe( {
    block: [
        block_foo,

        block_bar( {
            options: {
                params: ( { deps } ) => {
                    const foo_result = deps.prev[ 0 ];

                    return {
                        foo_id: foo_result.id,
                    };
                },
            },
        } ),

        block_quu( {
            options: {
                params: ( { deps } ) => {
                    const foo_result = deps.prev[ 0 ];
                    const bar_result = deps.prev[ 1 ];

                    return {
                        foo_id: foo_result.id,
                        bar_id: bar_result.id,
                    };
                },
            },
        } ),
    ],
} );
```

В этом примере сперва выполняется `block_foo`, затем `block_bar`, затем `block_quu`.
Если все блоки успешно отработали, то результатом работы `de.pipe` будет результат из последнего в цепочке блока (`block_quu`).
Если на любом этапе произошла ошибка, то этой же ошибкой заканчивается выполнение всего `de.pipe`.
Результаты выполнения предыдущих блоков доступны в `deps.prev`. Это массив.
Для `block_foo` он, очевидно, пустой, для `block_bar` он содержит один элемент — результат работы `block_foo`,
для `block_quu` он содержит два элемента — результат `block_foo` и результат `block_bar`.

