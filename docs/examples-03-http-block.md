## `de.http`

```js
const de = require( 'descript' );

module.exports = de.http( {
    block: {
        protocol: 'https:',
        host: 'api.auto.ru',
        port: 9000,

        headers: {
            'x-foo': 'FOO',
            'x-bar': ( { context } ) => {
                return context.req.cookies.bar;
            },
        },

        method: 'POST',
        path: de.jstring( '/1.0/user/{ params.user_id }/do_something' ),
        /*
        path: ( { params } ) => {
            return `/1.0/user/{ params.user_id }/do_something`;
        },
        */

        query: {
            foo: null,
            bar: 42,

            quu: de.jexpr( 'params.boo' ),
            //  quu: ( { params } ) => params.boo,
        },

        /*
        query: ( { params, context, deps } ) => {
            return {
                foo: params.foo,
                bar: ( params.bar !== undefined ) ? params.bar : 42,
                quu: params.boo,
            };
        },
        */

        body: de.jexpr( 'params.body' ),

        /*
        body: () => 'Привет!',
        //  text/plain
        */

        /*
        body: () => Buffer.from( 'Привет!' ),
        //  application/octet-stream
        */

        /*
        headers: {
            'content-type': 'application/json',
        },
        body: ( { params } => {
            return {
                id: params.id,
            };
        },
        //  application/json + JSON.stringify
        */

        /*
        body: ( { params } => {
            return {
                id: params.id,
            };
        },
        //  application/x-www-form-urlencoded + qs.stringify
        */

        //  is_json: true,

        timeout: 200,
        //  Не путать с options.timeout

        is_error: ( error, request_options ) => {
            return false;
        },

        max_retries: 1,
        retry_timeout: 100,
        is_retry_allowed: ( error, request_options ) => {
            return true;
        },
    },

} );
```

