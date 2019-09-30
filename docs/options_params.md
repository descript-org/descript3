# `options.params`

Позволяет изменить переданные блоку сверху параметры:

```js
const orig_params = {
    foo: 42,
};

const block = de.block( {
    options: {
        //  Вот сюда в params придет orig_params.
        //
        params: ( { params } ) => {
            console.log( params, params === orig_params );
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
    params: orig_params,
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


## `options.params` — объект

Вместо функции `options.params` можно задать объектом:

```js
options: {
    params: {
        foo: null,
        bar: 42,
        quu: ( { params, context, deps } ) => params.quu + 1,
    },
},
```

Вычисленные параметры будут объектом, у которого есть только эти ключи (`foo`, `bar`, `quu`).
Все остальное будет отфильтровано. У того, что осталось, значения вычисляются следующим образом:

  * `foo: null` означает, что будет взято соответствующее значение из переданных в блок параметров (т.е. это `params.foo`).
  * `bar: 42` означает тоже самое, что и `null`, но если `params.bar` не определено, то будет взято значение `42` (т.е. `42` — это дефолтное значение).
  * `quu: ( { params } ) => params.quu + 1` — тут все понятно, явно вычисляем значение.

В виде функции это можно переписать так:

```js
options: {
    params: ( { params } ) => {
        return {
            foo: params.foo,
            bar: ( params.bar === undefined ) ? 42 : params.bar,
            quu: params.quu + 1,
        };
    },
},
```

Для каких-то сложных вычислений обычно используется функция, но иногда удобнее и нагляднее использовать объект.
Особенно, когда нужно просто отфильтровать входящие параметры и оставить только нужные, плюс задать дефолтные значения.


## Наследование

При наследовании блоков их `options.params` вызываются последовательно. Сперва у родителя, затем у потомка.
Причем потомку в `params` приходит уже результат работы `options.params` родителя:

```js
const parent = de.block( {
    options: {
        //  Сперва вызовется эта функция, в params придет orig_params.
        //
        params: ( { params } ) => {
            return {
                ...params,
                parent: true,
            };
        },
    },
} );

const child = parent( {
    options: {
        //  Затем уже вызовется эта функция и сюда в params придет результат
        //  работы первой функции. Т.е. `{ foo: 42, parent: true }`.
        //
        params: ( { params } ) => {

            //  И дальше везде в работе блока будет использоваться этот объект.
            //  Т.е. `{ foo: 42, parent: true, child: true }`.
            //
            return {
                ...params,
                child: true,
            };
        },
    },
} );

const orig_params = {
    foo: 42,
};
de.run( child, { params: orig_params } );
```

Если где-то в цепочке наследования в `options.params` будет не функция, а объект, то произойдет ровно то же самое.
Результирующий объект вычисляется по описанным выше правилам, на вход подается результат работы предыдущего `options.params`
или те параметры, с которыми был запущен блок.
