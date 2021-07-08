import * as de from '../../lib';

//  ---------------------------------------------------------------------------------------------------------------  //

const block1 = de.http( {
    block: {
        parse_body({ body, headers}) {
            if (headers['content-type'].startsWith('application/json')) {
                return JSON.parse(body.toString('utf-8'));
            } else {
                return body;
            }
        }
    },
} );

de.run( block1, {
    params: {
        id: '12345',
    },
} )
    .then( ( result ) => {
        console.log( result );
    } );
