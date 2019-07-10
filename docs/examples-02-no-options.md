## `options.params`

```js
const de = require( 'descript' );

const block = require( '.../blocks/foo' );

module.exports = ( args ) => {
    const params = {
        id: args.params.some_other_id,
    };

    return block.run( { ...args, params } );
};
```


## `options.id` и `options.deps`

```js
const de = require( 'descript' );

const block_foo = require( '.../blocks/foo' );
const block_bar = require( '.../blocks/bar' );

module.exports = async ( args ) => {
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


## `options.before`

```js
const de = require( 'descript' );

const block = require( '.../blocks/foo' );

module.exports = ( args ) => {
    const { params } = args;
    if ( !params.id ) {
        throw de.error( {
            id: 'INVALID_PARAMS',
        } );
    }

    return block.run( args );
};
```


## `options.after`

```js
const de = require( 'descript' );

const block = require( '.../blocks/foo' );

module.exports = async function( args ) {
    const result = await block.run( args );

    if ( result.status === 'ERROR' ) {
        throw de.error( {
            id: 'SOME_ERROR',
        } );
    }

    return {
        status: result.status,
    };
};
```

