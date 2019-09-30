# `options.name`

Используется для [логгирования](./logs.md) [http-блоков](./http_block.md).

Приходит в `options.logger` в поле `event.request_options.name`:

```js
const logger = function( event ) {

    const name = event.request_options.name;

    ...
}

const block = de.http( {
    block: ...,

    options: {
        name: 'my_api.my_method',
        logger: logger,
    },
} );
```
