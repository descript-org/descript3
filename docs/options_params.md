# `options.params`

Позволяет изменить переданные блоку сверху параметры:

```js
const origParams = {
    foo: 42,
};

const block = de.block( {
    options: {
        //  Вот сюда в params придет origParams.
        //
        params: ( { params } ) => {
            console.log( params, params === origParams );
            //  { foo: 42 }, true

            return {
                ...params,
                bar: 24,
            };
        },

        //  Дальше во все остальные колбэки, где используются params
        //  будет приходить уже новые объект. Например, в before:
        //
        before: ( { params } ) => {
            console.log( params );
            //  { foo: 42, bar: 24 }
        },
    },
} );

//  Запускаем блок с какими-то параметрами:
//
const result = await de.run( block, {
    params: origParams,
} );
```


## Аргументы `options.params`

```js
options: {
    params: ( { params, context, deps } ) => {
        return {
            ...
        };
    },
},

options: {
    params: {
        foo: ( { params, context, deps } ) => ...,

        ...
    },
},
```


## Наследование

При наследовании блоков их `options.params` вызываются последовательно. Сперва у потомка, затем у родителя.
Причем родителю в `params` приходит уже результат работы `options.params` потомка:

```js
const parent = de.block( {
    options: {
        //  Затем уже вызовется эта функция и сюда в params придет результат
        //  работы первой функции. Т.е. `{ foo: 42, parent: true }`.
        //
        params: ( { params } ) => {
            return {
                ...params,
                parent: true,
            };
        },
    },
} );

const child = parent.extend( {
    options: {
        //  Сперва вызовется эта функция, в params придет origParams.
        //
        params: ( { params } ) => {
            //  И дальше везде в работе блока будет использоваться этот объект.
            //  Т.е. `{ foo: 42, child: true }`.
            //
            return {
                ...params,
                child: true,
            };
        },
    },
} );

const origParams = {
    foo: 42,
};
de.run( child, { params: origParams } );
```

