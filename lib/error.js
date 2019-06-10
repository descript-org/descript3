const no = require( 'nommon' );

//  ---------------------------------------------------------------------------------------------------------------  //

class DescriptError {
    constructor( error ) {
        this.error = error;
    }
}

//  ---------------------------------------------------------------------------------------------------------------  //

const ERROR_ID = {
    BLOCK_ABORTED: 'BLOCK_ABORTED',
    BLOCK_GUARDED: 'BLOCK_GUARDED',
    BLOCK_TIMED_OUT: 'BLOCK_TIMED_OUT',
    DEPS_ERROR: 'DEPS_ERROR',
    DEPS_NOT_RESOLVED: 'DEPS_NOT_RESOLVED',
    HTTP_CONNECTION_CLOSED: 'HTTP_CONNECTION_CLOSED',
    HTTP_CYCLIC_REDIRECT: 'HTTP_CYCLIC_REDIRECT',
    HTTP_REQUEST_ABORTED: 'HTTP_REQUEST_ABORTED',
    HTTP_UNKNOWN_ERROR: 'HTTP_UNKNOWN_ERROR',
    INVALID_JSON: 'INVALID_JSON',
    REDIRECTED: 'REDIRECTED',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    REQUIRED_BLOCK_FAILED: 'REQUIRED_BLOCK_FAILED',
    TCP_CONNECTION_TIMEOUT: 'TCP_CONNECTION_TIMEOUT',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    CANCELLED: 'CANCELLED',
    INCOMPLETE_RESPONSE: 'INCOMPLETE_RESPONSE',
    TOO_MANY_AFTERS_OR_ERRORS: 'TOO_MANY_AFTERS_OR_ERRORS',
};

//  ---------------------------------------------------------------------------------------------------------------  //

function create_error( error, id ) {
    if ( is_error( error ) ) {
        return error;
    }

    if ( error instanceof Error ) {
        const _error = {
            id: id || error.name,
            message: error.message,
            stack: error.stack,
        };

        if ( error.errno ) {
            _error.errno = error.errno;
        }
        if ( error.code ) {
            _error.code = error.code;
        }
        if ( error.syscall ) {
            _error.syscall = error.syscall;
        }

        error = _error;

    } else if ( typeof error === 'string' ) {
        error = {
            id: error,
        };
    }

    if ( !error ) {
        error = {};
    }

    if ( !error.id ) {
        error.id = ERROR_ID.UNKNOWN_ERROR;
    }

    return new DescriptError( error );
}

//  ---------------------------------------------------------------------------------------------------------------  //

function is_error( error, id ) {
    if ( error instanceof DescriptError ) {
        if ( id ) {
            return ( no.jpath( '.error.id', error ) === id );
        }

        return true;
    }

    return false;
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = {
    ERROR_ID: ERROR_ID,
    create_error: create_error,
    is_error: is_error,
};

