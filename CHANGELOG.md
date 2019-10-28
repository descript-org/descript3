# Changelog

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

