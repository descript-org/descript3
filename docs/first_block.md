# `de.first`

Иногда нужно выполнить несколько блоков последовательно, до тех пор, пока какой-нибудь из них не отработает успешно.

```js
import blockFoo from '.../blocks/foo';
import blockBar from '.../blocks/bar';
import blockQuu from '.../blocks/quu';

const block = de.first( {
    block: [
        blockFoo,
        blockBar,
        blockQuu,
    ],
} );
```

В этом примере сперва выполняется `blockFoo`. Если он отрабатыет успешно то выполнение `de.first` завершается и его результатом будет результат работы `blockFoo`.
Если `blockFoo` завершается ошибкой, то дальше выполняется `blockBar` и т.д.
Если все блоки завершились ошибкой, то `de.first` завершается ошибкой вида:

```js
de.error( {
    id: 'ALL_BLOCKS_FAILED',
    reason: [ errorFoo, errorBar, errorQuu ],
} )
```

В поле `reason` будет массив с ошибками соответствующих блоков.

Кроме того, для каждого блока в поле `deps.prev` будет приходить массив с ошибками всех предыдущих блоков.
Т.е. для `blockBar` будет массив из одного элемента — ошибки `blockFoo`,
а для `blockQuu` это будет массив из ошибки `blockFoo` и ошибки `blockBar`.

