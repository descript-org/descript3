# Работа с зависимостями

Часто нужно, запуская несколько блоков, выполнять их в определенном порядке,
а не все сразу параллельно.

Управлять порядком выполнения можно при помощи `options.id` и `options.deps`.
В `options.id` мы задаем блоку id-шник, а в `options.deps` мы можем указать, что блок
зависит от блока с таким-то id:


## Простой пример

```js
const block = ( { generateId } ) => {
    const fooId = generateId();

    return de.object( {
        block: {
            foo: blockFoo.extend( {
                options: {
                    //  Выдаем блоку id-шник.
                    //
                    id: fooId,
                },
            } ),

            bar: blockBar.extend( {
                options: {
                    //  Ждать, пока успешно завершит свою работу блок с id равным fooId.
                    //
                    deps: fooId,
                },
            } ),
        },
    } );

};
```

Здесь сперва запустится `blockFoo`, если он успешно отработает, то затем запустится `blockBar`.
Если `blockFoo` завершится ошибкой, то и `blockBar` завершится ошибкой `de.ERROR_ID.DEPS_ERROR`.


## Блок может зависить от нескольких блоков

```js
const block = ( { generateId } ) => {
    const fooId = generateId();
    const barId = generateId();

    return de.object( {
        block: {
            foo: blockFoo.extend( {
                options: {
                    id: fooId,
                },
            } ),

            bar: blockBar.extend( {
                options: {
                    id: barId,
                },
            } ),

            quu: blockQuu.extend( {
                options: {
                    //  Ждем выполнения и блока blockFoo, и блока blockBar.
                    //
                    deps: [ fooId, barId ],
                },
            } ),
        },
    } );

};
```

Аналогично. Сперва запускаются параллельно блоки `blockFoo` и `blockBar`.
Когда оба они успешно отработали, запустится блок `blockQuu`.
Если хотя бы один из них отработает с ошибкой, `blockQuu` опять таки сразу завершится с ошибкой `de.ERROR_ID.DEPS_ERROR`.


## Как использовать результат зависимостей

Иногда нам просто достаточно, чтобы один блок выполнился после окончания работы другого блока.
Но чаще всего, нам нужно результат одного блока использовать для запуска другого блока.

```js
const block = ( { generateId } ) => {
    const fooId = generateId();

    return de.object( {
        block: {
            foo: blockFoo.extend(( {
                options: {
                    id: fooId,
                },
            } ),

            bar: blockBar.extend(( {
                options: {
                    deps: fooId,

                    params: ( { deps } ) => {
                        //  В deps приходят результаты работы всех блоков,
                        //  от которых зависит блок.
                        //
                        //  Достаем результат blockFoo.
                        //
                        const fooResult = deps[ fooId ];

                        //  Используем значение из fooResult в качестве
                        //  параметра запроса блока blockBar.
                        //
                        return {
                            fooId: fooResult.id,
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


## `generateId()`

Чтобы установить связь между блоками, нужно использовать какой-то id-шник в `options.id` и `options.deps`.
И этот id-шник не может быть чем-либо, кроме результата работы `generateId`.
Эта функция приходит в обертку-замыкание или в `de.func`:

```js
const block = ( { generateId } ) => {
    const id = generateId();

    ...
};

const block = de.func( {
    block: ( { generateId } ) => {
        const id = generateId();

        ...
    },
} );
```

id-шники, сгенерированные при помощи `generateId`, действительны только внутри соответствующего замыкания.
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
const block = ( { generateId } ) => {
    const fooId = generateId();

    return de.object( {
        block: {
            foo: blockFoo,

            bar: blockBar.extend(( {
                options: {
                    //  А с таким id никто не запущен!
                    //
                    deps: fooId,
                },
            } ),
        },
    } );

};
```

После запуска блока `block` произойдет вот что:

  * Будет создан и запущен `de.object`

  * У этого `de.object` есть два подблока, один — `blockFoo` — можно запустить сразу (он не имеет никаких зависимостей),
    а `blockBar` ждет окончания работы блока с id `fooId`.

  * Блок `blockFoo` завершит свою работу (неважно, ошибкой или нет).

  * Возникнет ситуация, когда ни один блок не активен, но зависимости блока `blockBar` все еще не сошлись.

  * Блок `blockBar` упадет с ошибкой `de.ERROR_ID.DEPS_NOT_RESOLVED`.


При этом в целом такая схема, когда на момент старта `blockBar` никакой блок с id `fooId` не запущен, нормальна.
Могло быть так, что `blockFoo` запустит блок, который будет иметь таки `fooId` и тогда процесс сойдется
(или еще сложнее, запустит блок, который запустит блок, который запустит блок ..., который будет иметь нужный id).

```js
const block = ( { generateId } ) => {
    const fooId = generateId();

    return de.object( {
        block: {
            foo: de.func( {
                block: async () => {
                    await doSomething();

                    return de.block( {
                        options: {
                            id: fooId,
                        },
                    } );
                },
            } ),

            bar: blockBar.extend(( {
                options: {
                    deps: fooId,
                },
            } ),
        },
    } );

};
```
