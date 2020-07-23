import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

interface Context {
    is_mobile: boolean;
}

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn1 {
    id_1: string;
}

const block_1 = de.http( {
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
} );

//  ---------------------------------------------------------------------------------------------------------------  //

interface ParamsIn2 {
    id_2: number;
}

const block_2 = de.http( {
    block: {},
    options: {
        params: ( { params, context }: { params: ParamsIn2, context: Context } ) => {
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
