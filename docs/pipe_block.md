# `de.pipe`

Иногда нужно выполнить несколько блоков последовательно, передавая результат предыдущего блока в следующий.

```js
import blockFoo from '.../blocks/foo';
import blockBar from '.../blocks/bar';
import blockQuu from '.../blocks/quu';

const block = de.pipe( {
    block: [
        blockFoo,

        blockBar.extend( {
            options: {
                params: ( { deps } ) => {
                    const fooResult = deps.prev[ 0 ];

                    return {
                        fooId: fooResult.id,
                    };
                },
            },
        } ),

        blockQuu.extend( {
            options: {
                params: ( { deps } ) => {
                    const fooResult = deps.prev[ 0 ];
                    const barResult = deps.prev[ 1 ];

                    return {
                        fooId: fooResult.id,
                        barId: barResult.id,
                    };
                },
            },
        } ),
    ],
} );
```

В этом примере сперва выполняется `blockFoo`, затем `blockBar`, затем `blockQuu`.
Если все блоки успешно отработали, то результатом работы `de.pipe` будет результат из последнего в цепочке блока (`blockQuu`).
Если на любом этапе произошла ошибка, то этой же ошибкой заканчивается выполнение всего `de.pipe`.
Результаты выполнения предыдущих блоков доступны в `deps.prev`. Это массив.
Для `blockFoo` он, очевидно, пустой, для `blockBar` он содержит один элемент — результат работы `blockFoo`,
для `blockQuu` он содержит два элемента — результат `blockFoo` и результат `blockBar`.

