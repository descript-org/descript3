import {inferBlockTypes, DescriptBlockResultJSON} from '../../lib';
import * as de from '../../lib';

interface TRequest extends Request {
    session?: Session;
}

type SessionResult = {
    session: Session;
}

interface TDescriptContext {
    req: TRequest;
    res: Response;
    additionalParams?: Record<string, unknown>;
}

type Session = {
    id: string;
    username: string;
    client_id?: string;
}

const baseResource = de.http<TDescriptContext, object, DescriptBlockResultJSON<object>>( {
    block: {},
} );

const resource = baseResource( {
    block: {
        agent: { maxSockets: 16, keepAlive: true },
        max_retries: 1,
        timeout: 1000,
        headers: ( { headers, context } ) => {

            return {
                ...headers,
                'x-cookie': 'cookie',
            };
        },
    },
    options: {
        name: 'session',
    },
} );

const secondRequest = resource({
    block:{}
})

const session = resource( {
    block: {
        method: 'GET',
        pathname: '/1.0/session/',
        timeout: 300,
    },

    options: {
        name: 'publicApiAuth:GET /1.0/session',
        before: (args) => {
            const { context } = args;

            if (context.req.session) {
                // возвращаем кешированную сессию
                return context.req.session;
            }
        },

        after: ({ result }: { result: DescriptBlockResultJSON<SessionResult> }) => {
            const session = result.result.session;
            return session;
        },

        error: ({ error }) => {
            throw error;
        },
    },
} );

function getClientId({ params } : { params: any }) {
    return params.client_id;
}

const x = de.object({
    block: {
        secondRequest: inferBlockTypes(secondRequest({block:{}})),
        session: inferBlockTypes(session({
            options: {
                required: true,
            },
        })),
    },
    options: {
        params: (args) => {
            return {
                dealer_id: getClientId(args),
            };
        },

        after: ({context, params, result}) => {
            const session = result.session;

            return session;
        },
    }
});

const sessionMethod = de.func({
    block: ({generate_id: generateId}) => {
        const sessionId = generateId();


        return de.object({
            block: {
                session: inferBlockTypes(session({
                    options: {
                        id: sessionId,
                        required: true,
                        after: ({params, result}) => {
                            if ((params as any).dealer_id && result) {
                                result.client_id = (params as any).dealer_id;
                            }

                            return result;
                        },
                    },
                })),
            },
            options: {
                params: (args) => {
                    return {
                        dealer_id: getClientId(args),
                    };
                },

                after: ({context, params, result}) => {
                    const x = result;
                    const session = result.session as Session & Record<string, unknown>;

                    return session;
                },
            }
        });

    }
});

type Params = {
    param: string
}

const controller = de.func({
    block: ({ generate_id: generateId, params }: { params: Params; generate_id: de.DescriptBlockGenerateId }) => {
        const session1 = sessionMethod({
            options: {
                after: ({result}) => result
            }
        });

        return de.object({
            block: {
                session:session1,
                session2: inferBlockTypes(sessionMethod({ options: {
                        after: ({result}) => result
                    }})),
            },
            options: {
                after: ({result}) => result,
            }
        });
    },

    options: {
        after: ({result}) => result,
    }
})

de.run(controller, {})
    .then(result => {
        console.log(result.session, result.session2)
    })

const sessionMethod2 = de.func({
    block: ({generate_id: generateId}) => {
        const sessionId = generateId();

        const session2 = session({
            options: {
                id: sessionId,
                // При падении сессии роняем весь блок.
                // Тогда можно будет в нужных местах написать session({ options: { required: true } });
                required: true,
                after: ({params, result}) => {
                    if ((params as any).dealer_id && result) {
                        result.client_id = (params as any).dealer_id;
                    }

                    return result;
                },
            },
        });

        return de.object({
            block: {
                session: inferBlockTypes(session({
                    options: {
                        id: sessionId,
                        // При падении сессии роняем весь блок.
                        // Тогда можно будет в нужных местах написать session({ options: { required: true } });
                        required: true,
                        after: ({params, result}) => {
                            if ((params as any).dealer_id && result) {
                                result.client_id = (params as any).dealer_id;
                            }

                            return result;
                        },
                    },
                })),
                session2,
            },
            options: {
                params: (args) => {
                    return {
                        dealer_id: getClientId(args),
                    };
                },

                after: ({context, params, result}) => {
                    const session = result.session;
                    const session2 = result.session2;

                    return session;
                },
            }
        });
    }
} );


de.run(sessionMethod2, {})
    .then(result => {
        console.log(result.username)
    })

