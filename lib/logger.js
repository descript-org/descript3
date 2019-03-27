const no = require( 'nommon' );

//  ---------------------------------------------------------------------------------------------------------------  //

class Logger {

    constructor( config ) {
        config = config || {};

        this._debug = config.debug;
        this._date_formatter = no.date.formatter( config.date_format || '%d.%m.%Y %H:%M:%S.%f' );
    }

    log( event, context ) {
        switch ( event.type ) {
            case Logger.EVENT.REQUEST_START: {
                if ( this._debug ) {
                    const message = `[DEBUG] ${ event.request_options.options.method } ${ event.request_options.url }`;

                    this._log( process.stdout, message, context );
                }

                break;
            }

            case Logger.EVENT.REQUEST_SUCCESS: {
                let message = `${ event.result.status_code } ${ total( event ) } ${ event.request_options.options.method } ${ event.request_options.url }`;
                const body = event.request_options.body;
                if ( body ) {
                    if ( Buffer.isBuffer( body ) ) {
                        message += ' ' + String( body );

                    } else {
                        message += ' ' + body;
                    }
                }

                this._log( process.stdout, message, context );

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
                message += ` ${ total( event ) } ${ event.request_options.options.method } ${ event.request_options.url }`;

                this._log( process.stderr, message, context );

                break;
            }
        }
    }

    _log( stream, message, context ) {
        const date = this._date_formatter( new Date() );

        message = `${ date } ${ message } [pid ${ process.pid }][ctx ${ context._id }]\n`;

        stream.write( message );
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

Logger.EVENT = {
    REQUEST_START: 'REQUEST_START',
    REQUEST_SUCCESS: 'REQUEST_SUCCESS',
    REQUEST_ERROR: 'REQUEST_ERROR',
};

//  ---------------------------------------------------------------------------------------------------------------  //

function total( event ) {
    let total = `${ event.timestamps.end - event.timestamps.start }ms`;

    const retries = event.request_options.retries;
    const redirects = event.request_options.redirects;
    if ( retries || redirects ) {
        total += ' (';
        if ( retries ) {
            total += `retry #${ retries }`;
        }
        if ( retries && redirects ) {
            total += ', ';
        }
        if ( redirects ) {
            total += `redirect #${ redirects }`;
        }
        total += ')';
    }

    return total;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Logger;

