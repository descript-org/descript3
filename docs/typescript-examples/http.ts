import * as de from '../../lib';
import {DescriptBlockParams, DescriptBlockResult, DescriptBlockResultJSON, DescriptRequestOptions} from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //


interface Context {
    is_mobile: boolean;
}

interface ParamsIn1 {
    id_1: string;
}

interface ParamsOut1 {
    s1: string;
}

interface ResultIn1 {
    foo: string;
}
interface ResultOut1 {
    a: string;
    b: string;
}

const block1 = de.http( {
    block: {
        parse_body({ body, headers}) {
            if (!body) {
                return null;
            }

            if (headers['content-type'].startsWith('application/json')) {
                return JSON.parse(body.toString('utf-8'));
            } else {
                return body;
            }
        },
        is_error: (error, request_options) => {
            const statusCode = error.error.status_code;
            if (statusCode && statusCode >= 400 && statusCode <= 499) {
                return false;
            }

            return de.request.DEFAULT_OPTIONS.is_error(error, request_options);
        },
        is_retry_allowed: (error, request_options) => {
            // POST-запросы по умолчанию не ретраются
            const method = request_options.http_options.method;
            if ( method === 'POST' ) {
                const id = error.error.id;
                const statusCode = error.error.status_code;
                if (
                    id === de.ERROR_ID.TCP_CONNECTION_TIMEOUT ||
                    id === de.ERROR_ID.REQUEST_TIMEOUT ||
                    (statusCode && statusCode >= 500)
                ) {
                    return true;
                }
                return true;
            }

            return de.request.DEFAULT_OPTIONS.is_retry_allowed(error, request_options);
        },
    },

    options: ({
        params: ( { params }: { params: ParamsIn1 }) => {
            return {
                s1: params.id_1,
            };
        },

        after: ( { params, result }: { params: { s1: ParamsIn1['id_1']}; result: DescriptBlockResultJSON<ResultIn1>  } ) => {
            return {
                a: params.s1,
                b: result.result.foo,
            };
        },
    })
} );

de.run( block1, {
    params: {
        id_1: '12345',
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );

interface ParamsIn2 {
    id_2: string;
}

interface ParamsOut2 extends ParamsIn2, ParamsOut1 {
    s2: string;
}

interface ResultOut2 extends ResultOut1 {
    c: string;
}

//TODO автопроброс входных параметров предыдущих?
const block2 = block1<DescriptBlockParams<ParamsIn2 & ParamsIn1, ParamsIn2 & ParamsOut1, ParamsOut2>, DescriptBlockResult<ResultOut1, ResultOut2>>( {
    block: {},
    options: ({
        params: ( { params }) => {
            return {
                ...params,
                s2: params.s1,
            };
        },

        after: ( { params, result } ) => {
            return {
                ...result,
                a: params.s1,
                c: result.b,
            };
        },
    })
});

de.run( block2, {
    params: {
        id_1: '12345',
        id_2: '12345',
    }
} )
    .then( ( result ) => {
        console.log( result );
    } );
