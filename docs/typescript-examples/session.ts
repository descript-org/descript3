/* eslint-disable no-console */

import type { DescriptHttpBlockResult } from '../../lib';
import * as de from '../../lib';
import type DepsDomain from '../../lib/depsDomain';

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

type SessionParams = {
    dealerId?: string;
}

type Session = {
    id: string;
    username: string;
    clientId?: string;
}

const baseResource = de.http({
    block: {},
    options: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        before: ({ context }: { context?: TDescriptContext }) => {},
    },
});

const resource = baseResource.extend({
    block: {
        agent: { maxSockets: 16, keepAlive: true },
        maxRetries: 1,
        timeout: 1000,
        headers: ({ headers }) => {

            return {
                ...headers,
                'x-cookie': 'cookie',
            };
        },
    },
    options: {
        name: 'session',
    },
});

const secondRequest = resource.extend({
    block: {},
});

const session = resource.extend({
    block: {
        method: 'GET',
        pathname: '/1.0/session/',
        timeout: 300,
    },

    options: {
        name: 'publicApiAuth:GET /1.0/session',
        params: ({ params }: { params: SessionParams }) => params,
        before: (args) => {
            const { context } = args;

            if (context?.req.session) {
                // возвращаем кешированную сессию
                return context.req.session;
            }

            throw 's';
        },

        after: ({ result }: { result: DescriptHttpBlockResult<SessionResult> | Session }) => {
            const session = 'result' in result ? result.result.session : result;
            return session;
        },

        error: ({ error }) => {
            throw error;
        },
    },
});

function getClientId({ params }: { params: any }) {
    return params.clientId;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const temp = de.object({
    block: {
        secondRequest: secondRequest.extend({ block: {} }),
        session: session.extend({
            options: {
                required: true,
            },
        }),
    },
    options: {
        params: (args) => {
            return {
                dealerId: getClientId(args),
            };
        },

        after: ({ result }) => {
            const session = result.session;

            return session;
        },
    },
});

const sessionMethod = de.func({
    block: ({ generateId: generateId }) => {
        const sessionId = generateId();


        return de.object({
            block: {
                session: session.extend({
                    options: {
                        id: sessionId,
                        required: true,
                        after: ({ params, result }) => {
                            if (params.dealerId && result) {
                                result.clientId = params.dealerId;
                            }

                            return result;
                        },
                    },
                }),
            },
            options: {
                params: (args) => {
                    return {
                        dealerId: getClientId(args),
                    };
                },

                after: ({ result }) => {
                    const session = result.session;

                    return session;
                },
            },
        });

    },
});

type Params = {
    param: string;
}

const controller = de.func({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    block: ({ generateId: generateId, params }: { params: Params; generateId: DepsDomain['generateId'] }) => {
        const session1 = sessionMethod.extend({
            options: {
                after: ({ result }) => result,
            },
        });

        return de.object({
            block: {
                session: session1,
                session2: sessionMethod.extend({ options: {
                    after: ({ result }) => result,
                } }),
            },
            options: {
                after: ({ result }) => result,
            },
        });
    },

    options: {
        after: ({ result }) => result,
    },
});

de.run(controller, {})
    .then(result => {
        console.log(result.session, result.session2);
    });

const sessionMethod2 = de.func({
    block: ({ generateId: generateId }) => {
        const sessionId = generateId();

        const session2 = session.extend({
            options: {
                id: sessionId,
                // При падении сессии роняем весь блок.
                // Тогда можно будет в нужных местах написать session({ options: { required: true } });
                required: true,
                after: ({ params, result }) => {
                    if (params.dealerId && result) {
                        result.clientId = params.dealerId;
                    }

                    return result;
                },
            },
        });

        return de.object({
            block: {
                session: session.extend({
                    options: {
                        id: sessionId,
                        // При падении сессии роняем весь блок.
                        // Тогда можно будет в нужных местах написать session({ options: { required: true } });
                        required: true,
                        after: ({ params, result }) => {
                            if (params.dealerId && result) {
                                result.clientId = params.dealerId;
                            }

                            return result;
                        },
                    },
                }),
                session2,
            },
            options: {
                params: (args) => {
                    return {
                        dealerId: getClientId(args),
                    };
                },

                after: ({ result }) => {
                    const session = result.session;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const session2 = result.session2;

                    return session;
                },
            },
        });
    },
});


de.run(sessionMethod2, {})
    .then(result => {
        if (!de.isError(result)) {
            console.log(result.username);
        }
    });
