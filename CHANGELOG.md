# Changelog

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

