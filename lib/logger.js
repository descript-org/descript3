class Logger {

    constructor( config ) {
        config = config || {};

        this._debug = config.debug;
    }

    log( event, context ) {
        switch ( event.type ) {
            case Logger.EVENT.REQUEST_START: {
                if ( this._debug ) {
                    const message = `[DEBUG] ${ event.request_options.http_options.method } ${ event.request_options.url }`;

                    log_to_stream( process.stdout, message, context );
                }

                break;
            }

            case Logger.EVENT.REQUEST_SUCCESS: {
                let message = `${ event.result.status_code } ${ total( event ) } ${ event.request_options.http_options.method } ${ event.request_options.url }`;
                const body = event.request_options.body;
                if ( body ) {
                    if ( Buffer.isBuffer( body ) ) {
                        message += ' ' + String( body );

                    } else {
                        message += ' ' + body;
                    }
                }

                log_to_stream( process.stdout, message, context );

                break;
            }

            case Logger.EVENT.REQUEST_ERROR: {
                const error = event.error.error;

                let message = '[ERROR] ';
                if ( error.status_code > 0 ) {
                    message += error.status_code;

                } else {
                    if ( error.stack ) {
                        message += ' ' + error.stack;

                    } else {
                        message += error.id;
                        if ( error.message ) {
                            message += ': ' + error.message;
                        }
                    }
                }
                message += ` ${ total( event ) } ${ event.request_options.http_options.method } ${ event.request_options.url }`;

                log_to_stream( process.stderr, message, context );

                break;
            }
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

Logger.EVENT = {
    REQUEST_START: 'REQUEST_START',
    REQUEST_SUCCESS: 'REQUEST_SUCCESS',
    REQUEST_ERROR: 'REQUEST_ERROR',
};

//  ---------------------------------------------------------------------------------------------------------------  //

function log_to_stream( stream, message, context ) {
    const date = format_date( new Date() );

    message = `${ date } ${ message }\n`;

    stream.write( message );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function total( event ) {
    let total = `${ event.timestamps.end - event.timestamps.start }ms`;

    const retries = event.request_options.retries;
    if ( retries > 0 ) {
        total += ` (retry #${ retries })`;
    }

    return total;
}

//  ---------------------------------------------------------------------------------------------------------------  //

function format_date( date ) {
    return (
        pad2( date.getDate() ) + '.' +
        pad2( date.getMonth() + 1 ) + '.' +
        date.getFullYear() + ' ' +
        pad2( date.getHours() ) + ':' +
        pad2( date.getMinutes() ) + ':' +
        pad2( date.getSeconds() ) + '.' +
        pad3( date.getTime() % 1000 )
    );
}

function pad2( n ) {
    if ( n < 10 ) {
        return '0' + n;
    }

    return String( n );
}

function pad3( n ) {
    if ( n < 100 ) {
        return '0' + pad2( n );
    }

    return String( n );
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Logger;

