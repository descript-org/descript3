## Создаем простой http-блок

```js
const de = require( 'descript' );

module.exports = de.http( {

    block: {
        protocol: 'https:',
        host: 'api.auto.ru',
        port: 9000,

        method: 'GET',
        path: '/1.0/get_something/',

        query: {
            id: null,
        },
    },

    options: {
        after: ( { result } ) => {
            return {
                status: result.status,
            };
        },
    },

} );
```


## Запускаем блок

```js
const block = require( '.../blocks/foo' );
const params = {
    id: 42,
};
const result = await block.run( { params } );
```


## Расширяем блок

```js
const de = require( 'descript' );

const block = require( '.../blocks/foo' );

module.exports = block( {

    block: {
        timeout: 100,
    },

    options: {
        params: ( { params } ) => {
            return {
                id: params.some_other_id,
            };
        },
    },

} );
```


## Создаем de-object

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

module.exports = de.object( {

    block: {
        foo: block_foo,
        bar: block_bar( {
            options: {
                required: true,
            },
        } ),
    },

} );
```


## Создаем func-блок

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

module.exports = de.func( {
    block: ( { params } ) => {
        if ( params.foo ) {
            return block_foo;
        }

        if ( params.bar ) {
            return {
                bar: params.bar,
            };
        }

        throw de.error( {
            id: 'INVALID_PARAMS',
        } );
    },
} );
```


## Упрощенный func-блок

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

module.exports = function( { params } ) {
    if ( params.foo ) {
        return block_foo;
    }

    if ( params.bar ) {
        return {
            bar: params.bar,
        };
    }

    throw de.error( {
        id: 'INVALID_PARAMS',
    } );
};
```


## Создаем de.object с зависимостями

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

module.exports = function( { get_id } ) {
    const id = get_id();

    return de.object( {
        block: {
            foo: block_foo( {
                options: {
                    id: id,
                },
            } ),

            bar: block_bar( {
                options: {
                    deps: id,

                    params: ( { deps } ) => {
                        const result_foo = deps[ id ];

                        return {
                            bar: result_foo.bar,
                        };
                    },
                },
            } ),
        },
    } );
};
```


## То же самое, но проще

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

module.exports = async function( args ) {
    const result_foo = await block_foo.run( args );

    const params = {
        bar: result_foo.bar,
    };
    const result_bar = await block_bar.run( { ...args, params } );

    return {
        foo: result_foo,
        bar: result_bar,
    };
};
```

