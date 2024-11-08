# Логирование

## Logger

Что такое логгер. Это объект с одним методом `log`, в который приходят события:

```js
import * as de from 'descript';

const logger = {
    log: function( event, context ) {
        switch ( event.type ) {

            case de.EVENT.REQUEST_START: {
                const { requestOptions } = event;
                ...
                break;
            }

            case de.EVENT.REQUEST_SUCCESS: {
                const { requestOptions, result, timestamps } = event;
                ...
                break;
            }

            case de.EVENT.REQUEST_ERROR: {
                const { requestOptions, error, timestamps } = event;
                ...
                break;
            }

        }
    },
};
```

В поле `event.requestOptions` содержится много всего, описывающего http-запрос, который мы логируем.
В частности, в `event.requestOptions.http_options` содержится объект,
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
