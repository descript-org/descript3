# Отмена выполнения

```js
const promise = de.run( block, ... );
```

После того, как блок запущен, у нас есть только промис от этого запуска.
И, если по каким-то причинам, нам нужно остановить выполнение, одного промиса явно недостаточно.

Почему может понадобиться завершать выполнение? Например, входящий коннект от юзера закрылся,
значит уже нет смысла ждать получения данных, а лучше бы закрыть все наши http-запросы и не начинать новых,
еще не успевших запуститься. Или же случился таймаут. Или еще какая-то ошибка.

Для завершения выполнения нам нужен специальный cancellation token:

```js
const cancel = new de.Cancel();

//  На самом деле, так задавать таймаут не нужно,
//  лучше воспользоваться `options.timeout` у блока.
//
setTimeout( () => {
    cancel.cancel( de.error( {
        id: 'TIMEOUT',
    } ) );
}, 1000 );

//  Если вдруг входящий коннект закрылся, тормозим все наши запросы тоже.
//
req.once( 'close', () => {
    cancel.cancel( de.error( {
        id: 'INCOMING_REQUST_CLOSED',
    } ) );
} );

//  Запускаем блок и передаем туда наш токен
//
const result = de.run( block, { cancel } );
```


## Отмена изнутри блока

Помимо внешних причин отмены, бывают и внутренние причины.
Например, если блок ответил какой-то ошибкой или результат ответа нам не подходит:

```js
const block = de.block( {

    options: {
        error: ( { error, cancel } ) => {
            if ( error.error.id === 'SOME_ERROR' ) {
                cancel.cancel( de.error( {
                    id: 'SOME_OTHER_ERROR',
                } ) );
            }
        },
    },

} );
```

Даже если мы делали `de.run` без явного создания `cancel`, он все равно будет создан автоматически
и будет приходить во все колбэки.


## Как (не) правильно делать редирект

Если мы в процессе выполнения блока поняли, что юзера нужно средиректить на какой-то другой урл.
Можно сделать вот так:

```js
options: {
    after: ( { result, context } ) => {
        if ( result.redirect_url ) {
            const { res } = context;

            res.statusCode = 302;
            res.setHeader( 'location', result.redirect_url );
            res.end();
        }
    },
},
```

В целом это работает, но не очень хорошо.

Во-первых, если есть сразу несколько блоков,
которые могут делать `res.setHeader`, то возникнет ситуация, когда `res.setHeader` будет вызван после`res.end()`.
Это приведет к ошибкам вида "Headers already sent". Или возникнет race condition.

Во-вторых, это не очень удобно тестировать.

Более поддерживаемый вариант:

```js
const block = de.block( {
    options: {
        after: ( { result, cancel } ) => {
            if ( result.redirect_url ) {
                //  Не делаем редирект изнутри блока,
                //  но кидаем специальную ошибку о том, что нужно сделать редирект.
                //
                cancel.cancel( de.error( {
                    id: 'REDIRECT',
                    location: result.redirect_url,
                    status_code: 302,
                } ) );
            }
        },
    },
} );

try {
    const result = await de.run( block );
    ...

} catch ( error ) {
    //  Ловим ошибку, смотрим, что это редирект.
    //
    if ( error.error.id === 'REDIRECT' ) {
        res.statusCode = error.error.status_code || 302;
        res.setHeader( 'location', error.error.location );
        res.end();

        return;
    }
    ...
}
```
