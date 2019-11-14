# `de.first`

Иногда нужно выполнить несколько блоков последовательно, до тех пор, пока какой-нибудь из них не отработает успешно.

```js
const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );
const block_quu = require( '.../blocks/quu' );

const block = de.first( {
    block: [
        block_foo,
        block_bar,
        block_quu,
    ],
} );
```

В этом примере сперва выполняется `block_foo`. Если он отрабатыет успешно то выполнение `de.first` завершается и его результатом будет результат работы `block_foo`.
Если `block_foo` завершается ошибкой, то дальше выполняется `block_bar` и т.д.
Если все блоки завершились ошибкой, то `de.first` завершается ошибкой вида:

```js
de.error( {
    id: 'ALL_BLOCKS_FAILED',
    reason: [ error_foo, error_bar, error_quu ],
} )
```

В поле `reason` будет массив с ошибками соответствующих блоков.

Кроме того, для каждого блока в поле `deps.prev` будет приходить массив с ошибками всех предыдущих блоков.
Т.е. для `block_bar` будет массив из одного элемента — ошибки `block_foo`,
а для `block_quu` это будет массив из ошибки `block_foo` и ошибки `block_bar`.

