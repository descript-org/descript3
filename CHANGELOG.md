# Changelog

## `3.0.16`

  * `nommon` обновлен до версии `0.0.57`.

## `3.0.15`

  * Новые блоки: [de.pipe](./docs/pipe_block.md) и [de.first](./docs/first_block.md).

## `3.0.14`

  * `options.params`, `options.before`, `options.after` и `options.error` выполняются "послойно"
    при наследовании. Т.е. примерно так:

        child.params
        child.before
        parent.params
        parent.before
        action
        parent.after / parent.error
        child.after /child.error

  * Результат выполнения `options.error` финальный.
    Раньше, если `options.error` возвращал что-то (не кидал ошибку), то это что-то попадало в `options.after`.
    Теперь это окончательный результат выполнения блока.

  * [options.after] Раньше если `options.after` возвращал `undefined`, то вместо `undefined` брался
    предыдущий результат. Теперь результат `options.after` всегда учитывается.

  * Из `de.func`, `options.before`, `options.after` теперь можно вернуть блок.

  * Убрана сокращенная версия `de.func`.

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

