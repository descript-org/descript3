# `options`

```js
//  Создаем какой-то блок.
//  Вместо de.block должно быть что-то конкретное: de.http, de.array, ...
//
const block = de.block( {

    //  Описание блока, специфичное для каждого типа блока.
    block: ...,

    options: {
        //  Объект с опциями.
        //  Набор опций одинаковый для всех типов блоков.
        ...
    },

} );
```

## Кратко про все опции

```js
de.block( {

    block: ...,

    options: {
        //  Название блока, для логов.
        name: 'my_api.my_method',

        //  Зависимости между блоками.
        id: someId,
        deps: [ someId1, someId2, ... ],

        //  Возможность вычислить новые параметры для блока.
        params: ...,

        //  Возможность сделать что-нибудь до запуска блока, после запуска блока
        //  или в случае ошибки выполнения блока.
        before: ...,
        after: ...,
        error: ...,

        //  Таймаут выполнения.
        timeout: 1000,

        //  Параметры кэширования.
        key: ...,
        maxage: ...,
        cache: ...,

        //  Флаг о том, что блок является обязательным.
        //  Ошибка в нем приводит к ошибке родительского блока (de.array или de.object).
        required: true,

        //  Логгер.
        logger: ...,
    },
} )
```

  * [options.name](./options_name.md).
  * options.id и options.deps. См. [работа с зависимостями](./deps.md).
  * [options.params](./options_params.md).
  * [options.before](./options_before.md).
  * [options.after](./options_after.md).
  * [options.error](./options_error.md).
  * [options.timeout](./options_timeout.md).
  * options.key, options.maxage, options.cache. См. [кэширование](./cache.md).
  * [options.required](./options_required.md).
  * options.logger. См. [логирование](./logs.md).
