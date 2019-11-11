# Changelog

## `3.0.13`

  * [options.params] При наследовании `options.params` теперь вычисляются в обратном порядке.
    До этого сперва вычислялся `options.params` родителя и его результат отправлялся в
    `options.params` потомка. Теперь все наоборот.

## `3.0.12`

  * [options.params] В `options.params` теперь можно использовать только функцию.

    Такой код приведет к ошибке `{ id: 'INVALID_OPTIONS_PARAMS' }`:

        options: {
            params: {
                foo: null,
                bar: 42,
            },
        },

    `options.params` не нужно использовать для фильтрации параметров и/или задания дефолтных значений у параметров.
    Это правильнее делать в `http_block.query/body`.

## `3.0.11`

  * Изменен интерфейс работы с кэшом:
    Было:

        cache.get( key )
        cache.set( key, value, maxage )

    Стало

        cache.get( { key, context } )
        cache.set( { key, value, maxage, context } )

    Т.е. параметры теперь передаются одним объектом.
    Кроме того, добавился `context`.

## `3.0.10`

  * Bugfix. Не срабатывала ошибка `DEPS_NOT_RESOLVED` внутри `de.func`.

## `3.0.9`

  * [http] `path` и `host` переименованы в `pathname` и `hostname` соответственно.

    Было:

        de.http( {
            block: {
                host: 'my.api.net',
                path: '/foo/bar/',
            },
        } )

    Стало:

        de.http( {
            block: {
                hostname: 'my.api.net',
                pathname: '/foo/bar/',
            },
        } )

