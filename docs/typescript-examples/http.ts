import * as de from '../../lib';
import { DescriptRequestOptions } from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

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
        is_error: (error: de.DescriptError, request_options: DescriptRequestOptions) => {
            const statusCode = error.error.status_code;
            if (statusCode && statusCode >= 400 && statusCode <= 499) {
                return false;
            }

            return de.request.DEFAULT_OPTIONS.is_error(error, request_options);
        },
        is_retry_allowed: (error: de.DescriptError, request_options: DescriptRequestOptions) => {
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
    }
} );

de.run( block1, {
    params: {
        id: '12345',
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );
