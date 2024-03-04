import {DescriptBlockParams} from '../../lib';
import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn1 {
    id_1: string;
}

interface ParamsOut1 {
    s1: string;
}

interface ResultOut1 {
    a: string;
}

const block_1 = de.http<Context, DescriptBlockParams<ParamsIn1, ParamsIn1, ParamsOut1>, ResultOut1>( {
    block: {},
    options: {
        params: ( { params } ) => {
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
} );

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn2 {
    id_2: number;
}

interface ResultOut2 {
    b: string;
}

const block_2 = de.http<Context, DescriptBlockParams<ParamsIn2>, ResultOut2>( {
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

//  ---------------------------------------------------------------------------------------------------------------  //

const block_3 = de.object( {
    block: {
        foo: block_1,
        bar: block_2,
     },
    options: {
        after: ( { result } ) => {
            return {
                foo: result.foo.a,
                bar: result.bar.b,
            };
        },
    },
} );

de.run( block_3, {
    params: {
        id_1: '12345',
        id_2: 67890,
    },
} )
    .then( ( result ) => {
        console.log( result.foo, result.bar );
    } );

const block_4 = block_3( {
    options: {
        after: ( { result } ) => {
            return result.foo + result.bar;
        },
    },
} );

de.run( block_4, {
    params: {
        id_1: '12345',
        id_2: 67890,
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );
