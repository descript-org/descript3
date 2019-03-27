const url_ = require( 'url' );
const http_ = require( 'http' );

const decompress_response = require( 'decompress-response' );

//  ---------------------------------------------------------------------------------------------------------------  //

const RequestOptions = require( './request_options' );
const { ERROR_ID, create_error } = require( './error' );
const Logger = require( './logger.js' );

//  ---------------------------------------------------------------------------------------------------------------  //

function request( cancel, options, context ) {
    return new Promise( ( resolve, reject ) => {
        const visited_urls = {};

        let req = null;
        let h_timeout = null;
        let timestamps = null;

        //  FIXME.
        let is_resolved;

        cancel.subscribe( on_cancel );

        const request_options = new RequestOptions( options );
        do_request( request_options );

        function do_request( request_options ) {
            timestamps = {
                start: Date.now(),
            };

            const result = {
                status_code: 0,
                headers: {},
            };

            visited_urls[ request_options.url ] = true;

            if ( options.timeout > 0 ) {
                clear_timeout();

                h_timeout = setTimeout( function() {
                    if ( req ) {
                        //  Если обрываем запрос по таймауту, то надо обрывать request.
                        //  Сокет уничтожится автоматически.
                        req.abort();
                    }

                    //  Дальше решаем, что делать с запросом.
                    let error;
                    if ( !timestamps.tcp_connection ) {
                        //  Не смогли к этому моменту установить tcp-соединение.
                        error = {
                            id: ERROR_ID.TCP_CONNECTION_TIMEOUT,
                        };

                    } else {
                        //  Тут просто слишком долго выполняли запрос целиком.
                        error = {
                            id: ERROR_ID.REQUEST_TIMEOUT,
                        };
                        //  FIXME: Тут может быть ситуация, что получили HTTP 200, но не дождались полного ответа.
                        //  FIXME: Надо ее как-то обрабатывать?
                    }

                    do_retry( error );

                }, options.timeout );
            }

            const request_handler = function( res ) {
                //  FIXME: Выпилить этот decompress_response.
                res = decompress_response( res );
                res.once( 'readable', function() {
                    timestamps.first_byte = Date.now();
                } );

                const status_code = res.statusCode;
                const headers = res.headers;

                const buffers = [];
                let received_length = 0;
                //
                res.on( 'data', function( data ) {
                    if ( req.aborted ) {
                        //  Не обрабатываем входящие данные, если запрос оборван
                        return;
                    }

                    buffers.push( data );
                    received_length += data.length;
                } );

                result.status_code = status_code;
                result.headers = headers;

                res.on( 'end', function() {
                    //  FIXME: А нужна ли эта строчка? По идее это случится в do_done().
                    timestamps.end = Date.now();

                    if ( req.aborted ) {
                        //  Не обрабатываем ответ, если запрос оборван
                        return;
                    }

                    result.body = ( received_length ) ? Buffer.concat( buffers, received_length ).toString() : null;

                    if ( ( status_code >= 301 && status_code <= 303 ) || status_code === 307 ) {
                        if ( request_options.redirects < request_options.max_redirects ) {
                            let redirect_url = headers[ 'location' ];

                            //  FIXME: Проверять, что в redirect_url что-то есть.

                            if ( !/^https?:\/\//.test( redirect_url ) ) {
                                redirect_url = url_.format( {
                                    protocol: request_options.options.protocol,
                                    hostname: request_options.options.hostname,
                                    port: request_options.options.port,
                                    pathname: redirect_url,
                                } );
                            }

                            if ( visited_urls[ redirect_url ] ) {
                                const error = {
                                    id: ERROR_ID.HTTP_CYCLIC_REDIRECT,
                                    url: redirect_url,
                                };
                                do_fail( error, request_options );

                                return;
                            }

                            context.log( {
                                type: Logger.EVENT.REQUEST_SUCCESS,
                                request_options: request_options,
                                result: result,
                                timestamps: timestamps,
                            } );

                            const redirect_options = new RequestOptions( {
                                url: redirect_url,
                                method: 'GET',

                                redirects: request_options.redirects + 1,
                                retries: 0,

                                //  FIXME: Какой-то метод clone() может быть соорудить?
                                //  А то есть шанс добавить новые поля и забыть их тут скопировать.
                                max_retries: request_options.max_retries,
                                max_redirects: request_options.max_redirects,
                                is_retry_allowed: request_options.is_retry_allowed,
                                retry_timeout: request_options.retry_timeout,
                                is_error: request_options.is_error,
                                extra: request_options.extra,
                            } );

                            do_request( redirect_options );

                        } else {
                            do_done( result, request_options );
                        }

                        return;
                    }

                    const error = {
                        ...result,
                        id: 'HTTP_' + status_code,
                        message: http_.STATUS_CODES[ status_code ],
                    };
                    if ( request_options.is_error( error ) ) {
                        do_retry( error );

                        return;
                    }

                    do_done( result, request_options );
                } );

                res.on( 'close', function( error ) {
                    if ( is_resolved || req.aborted ) {
                        //  Не обрабатываем ответ, если запрос оборван
                        return;
                    }

                    error = {
                        id: ERROR_ID.HTTP_CONNECTION_CLOSED,
                        message: error ? error.message : 'UNEXPECTED_RESPONSE_CLOSED',
                    };
                    do_fail( error, request_options );
                } );
            };

            context.log( {
                type: Logger.EVENT.REQUEST_START,
                request_options: request_options,
            } );

            try {
                req = request_options.request_module.request( request_options.options, request_handler );

            } catch ( e ) {
                do_fail( e, request_options );

                return;
            }

            req.on( 'socket', function( socket ) {
                timestamps.socket = Date.now();

                if ( !socket.connecting ) {
                    //  Это сокет из пула, на нем не будет события 'connect'.
                    timestamps.tcp_connection = timestamps.socket;

                } else {
                    const on_connect = function() {
                        timestamps.tcp_connection = Date.now();
                    };

                    socket.once( 'connect', on_connect );

                    req.once( 'error', function() {
                        if ( socket ) {
                            socket.removeListener( 'connect', on_connect );
                        }
                    } );
                }
            } );

            req.on( 'error', function( error ) {
                if ( req.aborted ) {
                    //  FIXME: правда ли нет ситуация, когда это приведет к повисанию запроса?
                    return;
                }
                if ( is_resolved ) {
                    return;
                }

                error = {
                    id: ERROR_ID.HTTP_UNKNOWN_ERROR,
                    message: error.message,
                };
                destroy_request_socket();

                do_retry( error );
            } );

            if ( request_options.body ) {
                req.write( request_options.body );
            }

            req.end();

            function do_retry( error ) {
                if ( error.status_code === 429 || error.status_code >= 500 ) {
                    //  Удаляем сокет, чтобы не залипать на отвечающем ошибкой бекэнде.
                    destroy_request_socket();
                }

                if ( request_options.retries < request_options.max_retries && request_options.is_retry_allowed( error, request_options ) ) {
                    context.log( {
                        type: Logger.EVENT.REQUEST_ERROR,
                        request_options: request_options,
                        error: create_error( error ),
                        timestamps: timestamps,
                    } );

                    request_options.retries++;

                    if ( request_options.retry_timeout > 0 ) {
                        setTimeout(
                            function() {
                                do_request( request_options );
                            },
                            request_options.retry_timeout
                        );

                    } else {
                        do_request( request_options );
                    }

                } else {
                    do_fail( error, request_options );
                }
            }
        }

        function do_done( result, request_options ) {
            clear_timeout();

            timestamps.end = timestamps.end || Date.now();

            context.log( {
                type: Logger.EVENT.REQUEST_SUCCESS,
                request_options: request_options,
                result: result,
                timestamps: timestamps,
            } );

            is_resolved = true;

            resolve( result );
        }

        function do_fail( error, request_options ) {
            clear_timeout();

            timestamps.end = timestamps.end || Date.now();

            error = create_error( error );

            context.log( {
                type: Logger.EVENT.REQUEST_ERROR,
                request_options: request_options,
                error: error,
                timestamps: timestamps,
            } );

            is_resolved = true;

            reject( error );
        }

        function clear_timeout() {
            if ( h_timeout ) {
                clearTimeout( h_timeout );

                h_timeout = null;
            }
        }

        function on_cancel( reason ) {
            if ( is_resolved ) {
                return;
            }

            const error = {
                id: ERROR_ID.HTTP_REQUEST_ABORTED,
                reason: reason,
            };
            do_fail( error, request_options );

            if ( req ) {
                req.abort();
            }
        }

        function destroy_request_socket() {
            if ( req && req.socket ) {
                req.socket.destroy();
            }
        }
    } );
}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = request;

