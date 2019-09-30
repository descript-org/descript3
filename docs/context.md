# Контекст выполнения

Выполнение блока начинается запуском его через [de.run](./run.md):

```js
const block = de.block( ... );

const result = de.run( block );
```

Процесс выполнения состоит из нескольких [./phases.md](фаз выполнения) —
`options.before`, `action`, `options.after` и т.д.
Кроме того, экшен блока может приводить к запуску других (под)блоков.
Мы можем влиять на весь этот процесс задавая блокам [options](./options.md) и определяя сами [блоки](./blocks.md).

Например:

```js
const block = de.http( {

    block: {
        hostname: ( { context } ) => context.api.hostname,
        pathname: ( { params, context } ) => `${ context.api.version }/item/${ params.id }/`,
        ...
    },

    options: {
        after: ( { result, context } ) => {
            context.res.cookie( 'session', result.session, ... );
        }
    }

} );
```

И удобно иметь возможность во все эти колбэки (`pathname`, `after`, ...) передать некий общий объект — это и есть контекст.
Например, в нем может быть доступ к объекту `res`, при помощи которого мы можем выставлять куки.
Или же в нем может храниться конфиг, задающий параметры какого-то API.
Контекстом может быть что угодно вообще. Можно и вовсе его не передавать, если в нем нет необходимости:

```js
//  Не передаем контекст вообще.
//
const result = de.run( block );


//  Передаем что угодно.
//
const context = 42;
//  Не очень осмысленный контекст, но мало ли.
const result = de.run( block, { context } );


//  Более реалистично
//
const api_config = require( '.../api/config' );

const server = http_.createServer( ( req, res ) => {
    const params = ...;

    //  В req содержится много полезной для выполнения информации.
    //  А в res есть возможность, например, выставлять заголовки ответа,
    //  делать редиректы (не рекомендуется) и т.д.
    //
    const context = {
        req: req,
        res: res,
        api: api_config,
    };

    const result = de.run( block, { params, context } );
} );
```
