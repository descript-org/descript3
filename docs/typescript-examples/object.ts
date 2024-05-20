import {
    inferBlockTypes
} from '../../lib';
import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  ---------------------------------------------------------------------------------------------------------------  //
export interface CreateCardRequest {
    added_manually?: boolean;
    added_by_identifier?: string;
    // card: Card;
    card: Record<string, string>;
}

interface ParamsIn1 {
    id_1: string;
    payload: CreateCardRequest;
}
interface ParamsOut1 {
    s1: string;
}
interface Result1 {
    r: number;
}

const block_1 = de.http( {
    block: {
        body: ({ params }) => params.payload,
    },
    options: {
        params: ( { params }: { params: ParamsIn1, context: Context } ) => {
            return {
                s1: params.id_1,
                payload: params.payload
            };
        },

        after: ( { params, context, result }: { params: ParamsOut1, context: Context, result: Result1 } ) => {
            const a = {
                a: 1,
            };
            const b = {
                b: params.s1,
            }

            if (params.s1 === 'lol') {
                return a;
            }

            return b;
        },
    },
} );


de.run( block_1, {
    params: {
        id_1: '67890',
        payload: {
            card: {}
        }
    },
} )
    .then( ( result ) => {
        console.log( result );
        return {
            foo: 'a' in result ? result.a : result.b,
            bar: undefined,
        };
    } );

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn2 {
    id_2: number;
}

interface ResultOut2 {
    b: string;
}

const block_2 = de.http( {
    block: {},
    options: {
        params: ( { params }: {params: ParamsIn2} ) => {
            return params;
        },

        after: ( { params, result } ) => {
            return {
                b: String(params.id_2),
            };
        },
    },
} );

const block_2_func = de.func({
    block: (x) => block_2,
    options: {
        after: ({result}) => {
            console.log(result.b);
            return {
                b: result.b + '2',
                c: 1
            };
        }
    }
});

de.run( block_2_func, {
    params: {
        id_2: 67890,
    },
} )
    .then( ( result ) => {
        console.log( result );
        return {
            foo: result.c,
            bar: result.b,
        };
    } );


//  ---------------------------------------------------------------------------------------------------------------  //

const block_3 = de.object( {
    block: {
        foo: inferBlockTypes(de.http( {
            block: {},
            options: {
                params: ( { params }: { params: ParamsIn1, context: Context } ) => {
                    return {
                        s1: params.id_1,
                    };
                },

                after: ( { params, context } ) => {
                    return {
                        a: params.s1,
                    };
                },
            },
        } )),
        bar: block_2_func,
     },
    options: {
        params: ({params}) => params,
        after: ( { result, params } ) => {
            return {
                foo: {
                    ...result.foo,
                    c: 1,
                },
                bar: result.bar,
            };
        },
    },
} );

de.run( block_3, {
    params: {
        id_1: '12345',
        id_2: 67890,
        payload: {
            card: {}
        }
    },
} )
    .then( ( result ) => {
        console.log( result.foo.a, result.bar.b );
        return {
            foo: result.foo.a,
            bar: result.bar.b,
        };
    } );

const block_3_func = de.func( {
    block: () => {
        return block_3;
    },
    options: {
        after: ({ result }) => {
            return {
                foo: result.foo.a + '1',
                bar: result.bar.b + '1',
            }
        }
    }
});

de.run( block_3_func, {
    params: {
        id_1: '12345',
        id_2: 67890,
        payload: {
            card: {}
        }
    },
} )
    .then( ( result ) => {
        console.log( result.foo, result.bar );
    } );

const block_4 = block_3( {
    options: {
        after: ( { result } ) => {
            return result.foo.a + result.bar.b;
        },
    },
} );

const block_5 = block_3( {
    options: {
        error: ({ cancel, error }) => {
            if (error.error) {
                throw error;
            }
        },
        after: ( { result } ) => result,
    },
} );

de.run( block_4, {
    params: {
        id_1: '12345',
        id_2: 67890,
        payload: {
            card: {}
        }
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );
