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
        params: ( { params }) => {
            return {
                s1: params.id_1,
            };
        },

        after: ( { params } ) => {
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
    b: number;
}

const block_2 = de.http<Context, ParamsIn2, ResultOut2>( {
    block: {},
    options: {
        params: ( { params }) => {
            return params;
        },

        after: ( { params } ) => {
            return {
                b: params.id_2,
            };
        },
    },
} );

//  ---------------------------------------------------------------------------------------------------------------  //

const block_3 = de.array( {
    block: [ block_1, block_2 ] as const,
    options: {
        after: ( { result } ) => {
            return [ result[ 0 ].a, result[ 1 ].b ] as const;
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
        console.log( result[ 0 ], result[ 1 ] );
    } );

const block_4 = block_3( {
    options: {
        after: ( { result } ) => {
            return result[ 0 ];
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
