# `de.run`

## Простой пример

```js
//  Создаем блок или же require'им готовый.
const block = de.block( ... );

try {
    //  Запускаем блок.
    const result = await de.run( block );

    //  Делаем что-то с результатом.
    ...

} catch ( error ) {
    //  Обрабатываем ошибки.
    ...
}
```


## Аргументы `de.run`

Кроме блока, который мы запускаем, можно передать еще ряд параметров:

```js
de.run( block, {
    //  Параметры блока.
    params: params,
    //  Контекст выполнения.
    context: context,
    //  Токен для остановки запроса.
    cancel: cancel,
} );
```

Подробнее про [контекст](./context.md) и про [токены отмены](./cancel.md).


## Сложный пример

Более-менее приближенный к реальности пример.

```js
const http_ = require( 'http' );
const url_ = require( 'url' );

//  Роутер. Превращает урл в пару { page_id, page_params }.
//
const router = require( '.../router' );

//  Словарь страничных блоков.
//  Каждому page_id соответствует какой-то дескриптовый блок.
//
const PAGES = {
    index: require( '.../descript/blocks/index' ),
    ...
};

//  Сервер, обрабатывающий входящие http-запросы.
//
const server = http_.createServer( async ( req, res ) => {
    //  Определяем, что за страница соответствует урлу в req.url.
    //
    const route = router( req.url );

    if ( !route ) {
        //  Неизвестная страница, отдаем 404.
        //
        res.statusCode = 404;
        res.end();

        return;
    }

    const { page_id, page_params } = route;

    //  Ищем в нашем словаре дескриптовый блок для page_id.
    //
    const page = PAGES[ page_id ];
    if ( !page ) {
        //  Опять ничего не нашли. 404.
        //
        res.statusCode = 404;
        res.end();

        return;
    }

    //  В верхнеуровневый блок (который мы запускаем через de.run)
    //  передаем просто параметры из урла.
    //
    const params = page_params;
    
    //  Контекст запуска. См. context.md.
    //  Как правило туда имеет смысла включать res, иногда req.
    //  Кроме того, туда можно добавлять любые данные, которые могут понадобиться
    //  блокам в процессе выполнения.
    //
    const context = { req, res };

    //  Токен для аварийной остановки выполнения. См. cancel.md.
    //
    const cancel = new de.Cancel();

    //  В случае закрытия внешнего коннекта, нет смысла дальше
    //  продолжать запрашивать данные. Завершаем выполнение de.run.
    //
    req.once( 'close', () => {
        cancel.cancel( de.error( {
            id: 'REQUEST_ABORTED',
        } ) );
    } );

    try {
        //  Собственно запускаем блок со всеми нужными аргументами.
        //
        const result = await de.run( page, { params, context, cancel } );

        //  Данные получены. Превращаем их как-то в html (или может быть отдаем их в JSON).
        //
        const html = generate_html( result );

        //  Отвечаем этим html'ем юзеру.
        //
        res.statusCode = 200;
        res.setHeader( 'content-type', 'text/html' );
        res.end( html );

    } catch ( error ) {
        //  Где-то в процессе произошла ошибка.
        //  В реальной жизни чаще всего приходится различать, что за ошибка.
        //  Но для простоты просто отвечаем 500-кой.
        //
        res.statusCode = 500;
        res.end();
    }

});

server.listen( 9000 );
```
