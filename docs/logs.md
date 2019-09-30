# Логирование

## Logger

Что такое логгер. Это объект с одним методом `log`, в который приходят события:

```js
const de = require( 'descript' );

const logger = {
    log: function( event, context ) {
        switch ( event.type ) {

            case de.Logger.EVENT.REQUEST_START: {
                const { request_options } = event;
                ...
                break;
            }

            case de.Logger.EVENT.REQUEST_SUCCESS: {
                const { request_options, result, timestamps } = event;
                ...
                break;
            }

            case de.Logger.EVENT.REQUEST_ERROR: {
                const { request_options, error, timestamps } = event;
                ...
                break;
            }

        }
    },
};
```

В поле `event.request_options` содержится много всего, описывающего http-запрос, который мы логируем.
В частности, в `event.request_options.http_options` содержится объект,
который был отправлен в нодовский метод `http.request` (или `https.request`).


## `options.logger`

Позволяет логировать некоторые события.
В данный момент, это события связанные с http-запросами.
Возможно, в будущем появится что-то еще, поэтому оно в `options`,
а не в `http_block.logger`.

```js
const block = de.block( {
    options: {
        logger: logger,
    },
} );
```
