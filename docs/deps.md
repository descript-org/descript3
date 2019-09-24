# Работа с зависимостями

Часто нужно, запуская несколько блоков, выполнять их в определенном порядке,
а не все сразу параллельно.

Управлять порядком выполнения можно при помощи `options.id` и `options.deps`.
В `options.id` мы задаем блоку id-шник, а в `options.deps` мы можем указать, что блок
зависит от блока с таким-то id:


## Простой пример

```js
const block = ( { generate_id } ) => {
    const foo_id = generate_id();

    return de.object( {
        block: {
            foo: block_foo( {
                options: {
                    //  Выдаем блоку id-шник.
                    //
                    id: foo_id,
                },
            } ),

            bar: block_bar( {
                options: {
                    //  Ждать, пока успешно завершит свою работу блок с id равным foo_id.
                    //
                    deps: foo_id,
                },
            } ),
        },
    } );

};
```

Здесь сперва запустится `block_foo`, если он успешно отработает, то затем запустится `block_bar`.
Если `block_foo` завершится ошибкой, то и `block_bar` завершится ошибкой `de.ERROR_ID.DEPS_ERROR`.


## Блок может зависить от нескольких блоков

```js
const block = ( { generate_id } ) => {
    const foo_id = generate_id();
    const bar_id = generate_id();

    return de.object( {
        block: {
            foo: block_foo( {
                options: {
                    id: foo_id,
                },
            } ),

            bar: block_bar( {
                options: {
                    id: bar_id,
                },
            } ),

            quu: block_quu( {
                options: {
                    //  Ждем выполнения и блока block_foo, и блока block_bar.
                    //
                    deps: [ foo_id, bar_id ],
                },
            } ),
        },
    } );

};
```

Аналогично. Сперва запускаются параллельно блоки `block_foo` и `block_bar`.
Когда оба они успешно отработали, запустится блок `block_quu`.
Если хотя бы один из них отработает с ошибкой, `block_quu` опять таки сразу завершится с ошибкой `de.ERROR_ID.DEPS_ERROR`.


## Как использовать результат зависимостей

Иногда нам просто достаточно, чтобы один блок выполнился после окончания работы другого блока.
Но чаще всего, нам нужно результат одного блока использовать для запуска другого блока.

```js
const block = ( { generate_id } ) => {
    const foo_id = generate_id();

    return de.object( {
        block: {
            foo: block_foo( {
                options: {
                    id: foo_id,
                },
            } ),

            bar: block_bar( {
                options: {
                    deps: foo_id,

                    params: ( { deps } ) => {
                        //  В deps приходят результаты работы всех блоков,
                        //  от которых зависит блок.
                        //
                        //  Достаем результат block_foo.
                        //
                        const foo_result = deps[ foo_id ];

                        //  Используем значение из foo_result в качестве
                        //  параметра запроса блока block_bar.
                        //
                        return {
                            foo_id: foo_result.id,
                        };
                    },
                },
            } ),
        },
    } );

};
```

Если у блока были зависимости, то во все "хуки" (`options.params`, `options.before`, ...) в поле `deps`
будет приходить объект с результатами этих зависимостей.


## `generate_id()`

Чтобы установить связь между блоками, нужно использовать какой-то id-шник в `options.id` и `options.deps`.
И этот id-шник не может быть чем-либо, кроме результата работы `generate_id`.
Эта функция приходит в обертку-замыкание или в `de.func`:

```js
const block = ( { generate_id } ) => {
    const id = generate_id();

    ...
};

const block = de.func( {
    block: ( { generate_id } ) => {
        const id = generate_id();

        ...
    },
} );
```

id-шники, сгенерированные при помощи `generate_id`, действительны только внутри соответствующего замыкания.
И при попытке использовать какое-либо другое значение в качестве id, блок завершится с ошибкой `de.ERROR_ID.INVALID_DEPS_ID`.


## Ошибки `de.ERROR_ID.DEPS_ERROR` и `de.ERROR_ID.DEPS_NOT_RESOLVED`

Обе ошибки связаны с проблема при разрешении зависимостей, но случаются в немного разных ситуациях:

  * Если хотя бы один из блоков, от которых зависит блок, завершился ошибкой, то этот блок тоже завершится
    ошибкой `de.ERROR_ID.DEPS_ERROR`.

  * Если возник момент, когда блок все еще ожидает своих зависимостей, но ни один из блоков уже не выполняется,
    то все блоки с зависимостями заканчиваются с ошибкой `de.ERROR_ID.DEPS_NOT_RESOLVED`.

Т.е. первая ошибка — это рантайм-ошибка, что-то пошло не так в процессе выполнения других блоков,
а вторая ошибка — это скорее проблема архитектурная.

Например:

```js
const block = ( { generate_id } ) => {
    const foo_id = generate_id();

    return de.object( {
        block: {
            foo: block_foo,

            bar: block_bar( {
                options: {
                    //  А с таким id никто не запущен!
                    //
                    deps: foo_id,
                },
            } ),
        },
    } );

};
```

После запуска блока `block` произойдет вот что:

  * Будет создан и запущен `de.object`

  * У этого `de.object` есть два подблока, один — `block_foo` — можно запустить сразу (он не имеет никаких зависимостей),
    а `block_bar` ждет окончания работы блока с id `foo_id`.

  * Блок `block_foo` завершит свою работу (неважно, ошибкой или нет).

  * Возникнет ситуация, когда ни один блок не активен, но зависимости блока `block_bar` все еще не сошлись.

  * Блок `block_bar` упадет с ошибкой `de.ERROR_ID.DEPS_NOT_RESOLVED`.


При этом в целом такая схема, когда на момент старта `block_bar` никакой блок с id `foo_id` не запущен, нормальна.
Могло быть так, что `block_foo` запустит блок, который будет иметь таки `foo_id` и тогда процесс сойдется
(или еще сложнее, запустит блок, который запустит блок, который запустит блок ..., который будет иметь нужный id).

```js
const block = ( { generate_id } ) => {
    const foo_id = generate_id();

    return de.object( {
        block: {
            foo: de.func( {
                block: async () => {
                    await do_something();

                    return de.block( {
                        options: {
                            id: foo_id,
                        },
                    } );
                },
            } ),

            bar: block_bar( {
                options: {
                    deps: foo_id,
                },
            } ),
        },
    } );

};
```
