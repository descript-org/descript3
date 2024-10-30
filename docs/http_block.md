# `de.http`

Этот блок, как следует из названия, делает http-запросы.

```js
import * as de from 'descript';

const block = de.http( {

    block: {
        //  Параметры блока. См. ниже.
        ...
    },

    //  Опции.
    options: ...,

} );
```

[Опции](./options.md) у всех блоков одинаковые.


## Основные параметры блока

Как правило, http-блок создается не для какого-то одного конкретного урла,
но для семейства урлов, определяемых параметрами `protocol`, `hostname`, `port`, `method` и `pathname`.
Все эти параметры могут вычисляться и динамически, но чаще всего все они, кроме `pathname` заданы статически.

```js
const block = de.http( {

    block: {
        protocol: 'https:',
        hostname: 'api.myhost.net',
        port: 9000,

        method: 'GET',
        pathname: ( { params } ) => `/v1/${ params.category }/list/`,

        ...
    },

} );
```

Если блок делает запросы в разные порты, хосты и т.д. в зависимости от параметров или чего-то еще,
то это, скорее всего, просто разные блоки.

Хотя иногда можно делать что-то такое:

```js
const block = de.http( {

    block: {
        protocol: ( { context } ) => context.config.api.protocol,
        hostname: ( { context } ) => context.config.api.host,
        port: ( { context } ) => context.config.api.port,

        //  Тоже может быть функцией, но это редко когда нужно.
        method: 'GET',
        pathname: ( { params } ) => `/v1/${ params.category }/list/`,

        ...
    },

} );
```


## `query`

Одного `pathname` для построения урла недостаточно, поэтому еще есть `query`:

### `query` в виде функции

```js
block: {
    pathname: ( { params } ) => `/v1/${ params.category }/list/`,
    query: ( { params } ) => {
        page_num: params.page_num,
        page_size: 10,
    },
},
```

Если в `params` будет `{ category: 'cars', page_num: 7 }`, то получим урл `/v1/cars/list/?page_num=7&page_size=10`.


### `query` в виде объекта

Иногда, когда не нужно каких-то сложных вычислений параметров, можно задать `query` не функцией, а объектом:

```js
block: {
    query: {
        //  Взять значение из params.page_number.
        //
        page_num: null,

        //  Взять значение из params.page_size, а если оно undefined,
        //  то использовать дефолтное значение 10.
        //
        page_size: 10,

        //  Функция, позволяет вычислить что-то более сложное.
        //  См. ниже про параметры, которые сюда передаются.
        //
        debug: ( { context } ) => ( context.env === 'development' ) ? 'yes' : '',
    },
},
```

То же самое, если задать `query` функцией:

```js
block: {
    query: ( { params, context } ) => {
        return {
            page_num: params.page_num,
            page_size: ( params.page_size === undefined ) : 10 : params.page_size,
            debug: ( context.env === 'development' ) ? 'yes' : '',
        };
    },
},
```


## `headers`

Передать http-заголовки можно параметром `headers`:

```js
block: {
    headers: {
        'x-foo': 'FOO',
        'x-bar': ( { params } ) => params.bar,
        ...
    },
},
```

Или же сразу целиком вычисляем объект с заголовками:

```js
block: {
    headers: ( { params } ) => {
        return {
            'x-foo': 'FOO',
            'x-bar': params.bar,
            ...
        };
    },
},
```


## `body` и `body_compress`

Для `POST`, `PUT` и `PATCH` запросов почти всегда нужно передавать что-то в `body`:

```js
block: {
    body: ( { params } ) => {
        return ...;
    },
},
```

`body` можно задать и статически, но, как правило, в этом нет смысла:

```js
block: {
    body: 'Привет!',
},
```

Что может быть в body: строка, `Buffer`, объект.

### Строка

```js
block: {
    body: () => 'Привет!',
},
```

Если заголовок `content-type` явно не указан, то он будет выставлен в `text/plain`.
Но всегда можно явно задать `content-type`:

```js
block: {
    headers: ( { headers } ) => {
        return {
            ...headers,
            'content-type': 'text/html',
        };
    }
    body: () => '<h1>Привет!</h1>',
},
```

Параметр `compress_body` позволяет сжать тело запроса с помощью gzip.
К запросу автоматически будет добавлен заголовок `content-encoding: gzip`

```js
block: {
    headers: ( { headers } ) => {
        return {
            ...headers,
            'content-type': 'text/html',
        };
    }
    body: () => '...large_body....',
    body_compress: true,
},
```

```js
block: {
    headers: ( { headers } ) => {
        return {
            ...headers,
            'content-type': 'text/html',
        };
    }
    body: () => '...large_body....',
    body_compress: {
        level: 1,
    },
},
```

### `Buffer`

```js
block: {
    body: () => Buffer.from( 'Привет!' ),
},
```

Если заголовок `content-type` явно не указан, то он будет выставлен в `application/octet-stream`.

### Объект и `content-type: application/json`

```js
block: {
    headers: ( { headers } ) => {
        return {
            ...headers,
            'content-type': 'application/json',
        };
    },
    body: ( { params } ) => {
        return {
            id: params.id,
        };
    },
},
```

В этом случае объект, возвращенный из `body`, будет сериализован при помощи `JSON.stringify`.

### Объект с каким-то другим `content-type`

В этом случае объект будет сериализован при помощи `require( 'querystring' ).stringify`.
Если `content-type` не задан, то он будет выставлен в `application/x-www-form-urlencoded`.


## `family`

```js
block: {
    family: 4,
    family: 6,
}
```


## `agent`

```js
const http = require( 'http' );

block: {
    //  Стандартные значения для ноды:
    agent: undefined,
    agent: false,
    agent: new http.Agent( ... ),
}
```

Кроме того, можно передать объект.
В этом случае этот объект будет использован как аргумент для http.Agent или https.Agent.
Полученный агент будет закэширован:

```js
const agentOptions = {
    keepAlive: true,
    maxSockets: 16,
};

const block1 = de.http( {
    ...
    agent: agentOptions,
} );

const block2 = de.http( {
    ...
    agent: agentOptions,
} );
```

Для `block1` и `block2` будет использован один и тот же агент.


## `timeout`

Таймаут на запрос в миллисекундах:

```js
block: {
    //  Ждем одну секунду на запрос.
    timeout: 1000,
},
```

**Важно!** Это таймаут на один запрос. Если блоку разрешено делать ретрай (см. ниже),
то на каждый такой запрос будет свой таймаут.

Например, вот такой блок может работать больше 4 секунд (1000 + 500 + 1000 + 500 + 1000):

```js
block: {
    timeout: 1000,
    maxRetries: 2,
    retryTimeout: 500,
},
```

Если нужно ограничить суммарное время работы блока, то нужно использовать `options.timeout`:

```js
block: {
    ...
},
options: {
    ...
    timeout: 1000,
},
```


## `isJson`

Если в ответе на http-запрос будет заголовок `content-type: application/json`, то descript попытается автоматически
распарсить ответ при помощи `JSON.parse`.
Но если так вышло, что мы точно знаем, что в ответе должен вернуться json, а заголовок по каким-то причинам отсутствует,
можно выставить флаг `isJson: true`:

```js
block: {
    isJson: true,
},
```

В этом случае, ответ всегда будет парситься через `JSON.parse`.


## `isError`

По-дефолту, если статус ответа больше или равен 400, то это считается ошибкой.
Это поведение можно переопределить. Например, иногда полезно не считать такие ответы ошибкой.
Или же наоборот, ответ с кодом 200, но каким-то специальным заголовком, считать ошибкой.

Можно переопределить параметр `isError`.
Дефолтный `isError` доступен как `de.request.DEFAULT_OPTIONS.isError`.


Не считать вообще ничего ошибкой:

```js
block: {
    isError: () => false,
},
```

Считать ответ со кодом ответа 200 и специальным заголовком ошибкой:

```js
impoer * as de from 'descript';

const block = de.http( {
    block: {
        isError: ( error, requestOptions ) => {
            if ( error.error.statusCode === 200 && error.error.headers[ 'x-foo' ] === 'FOO' ) {
                return true;
            }

            //  Все остальное отправляем в дефолтный isError.
            //
            return de.request.DEFAULT_OPTIONS.isError( error, requestOptions );
        },
    },
} );
```


## Ретраи

Если мы сделали запрос и получили ошибку, иногда можно и нужно сделать повторный запрос (или несколько).
Перезапросы настраиваются тремя параметрами:

  * `isRetryAllowed` — функция (похожая на `isError`), которая сообщает, можно ли этот конкретный запрос ретраить.
  * `maxRetries` — сколько можно сделать ретраев (по-дефолту 0).
  * `retryTimeout` — пауза между ретраями в миллисекундах (по-дефолту 100).

```js
block: {
    isRetryAllowed: ( error, requestOptions ) => {
        if ( error.error.statusCode === 404 ) {
            //  У нас странный бэкенд.
            return true;
        }

        return de.request.DEFAULT_OPTIONS.isRetryAllowed( error, requestOptions );
    },

    //  Т.е. всего будет сделано максимум 3 запроса, прежде чем мы окончательно сдадимся
    //  и завершим работу с ошибкой.
    //
    maxRetries: 2,

    retryTimeout: 500,
},
```


## `prepareRequestOptions`

Чорная магия.

```js
block: {
    prepareRequestOptions: ( requestOptions ) => {
        requestOptions.headers[ 'x-foo' ] = 'FOO';

        return requestOptions;
    },
},
```


## `options.name`

```js
options: {
    name: 'my_api:my_method',
},
```


## `options.logger`

```js
options: {
    logger: new de.Logger(),
},
```


## Наследование

Если у нас есть http-блок, то мы можем подправить его поведение, поменять то, как вычисляются параметры запроса и т.д.:

```js
const parent = de.http( ... );

const child = parent.extend( {
    block: {
        ...
    },
    options: ...,
} )
```

[Опции](./options.md) наследуются стандартным для всех блоков образов.

Как наследуются параметры блока. Все, кроме `query` и `headers` просто перезатирается.
Т.е. если у `parent` и `child` задан один и тот же параметр, то значение параметра у `parent` на `child`
не действует:

```js
const parent = de.http( {
    block: {
        pathname: '/foo/bar',
        body: () => 'Привет!',
        timeout: 1000,
        ...
    },
} );

const child = parent.extend( {
    block: {
        //  Все эти параметры перетирают соответствующие значения параметров parent.
        //
        pathname: '/bar/foo',
        body: () => 'Пока!',
        timeout: 500,
        ...
    },
} );
```

### Наследование `query` и `headers`

`query` и `headers` не перезатирают значения родителя, но дополняют:

```js
const child = parent.extend( {

    block: {
        //  Добавляем к тому, что отправляет в query родитель еще один параметр.
        //
        query: ( { query } ) => {
            return {
                ...query,
                foo: 42,
            };
        },

        //  Удаляем один из заголовков.
        //
        headers: ( { headers } ) => {
            delete headers[ 'x-foo' ];
            return headers;
        },
    },

} );
```

Это позволяет нам не копировать `query` и `headers` из блока в блок,
а просто доопределять их при наследовании.


## Аргументы колбэков

Многие параметры http-блока задаются функциями.
Во все эти функции передается стандартный набор параметров: `params`, `context` и `deps`
(если у блока есть [зависимости](./deps.md)).

И есть два исключения: `query` и `headers` — в них приходит еще один параметр.
Это `query` и `headers` соответственно и в нем находится значение, вычисленное на предыдущем шаге в цепочке наследования.

```js
block: {

    //  Все, кроме query и headers
    //
    pathname: ( { params, context, deps } ) => {
        return ...;
    },

    //  Для query приходит еще и параметр query.
    //  Это позволяет нам в базовом блоке определять, как вычисляется query,
    //  а в блоке-потомке добавлять туда дополнительные поля.
    //
    query: ( { params, context, deps, query } ) => {
        return {
            ...query,
            debug: 'true',
        },
    },

    //  Тут так же, как и в query.
    //  В базовом блоке можно задать какие-то общие заголовки,
    //  а в блоке потомке добавить что-то специфичное.
    //
    headers: ( { params, context, deps, headers } ) => {
        return {
            ...headers,
            'x-extra-header': '1',
        };
    },

},
```
