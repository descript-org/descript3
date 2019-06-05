const url_ = require( 'url' );

//  ---------------------------------------------------------------------------------------------------------------  //

class Answer {
    constructor( answer ) {
        if ( typeof answer === 'function' ) {
            this.answer = answer;

        } else {
            this.answer = {};

            this.answer.status_code = answer.status_code || 200;
            this.answer.headers = answer.headers || {};

            this.answer.content = answer.content || null;

            this.answer.timeout = answer.timeout || 0;

            if ( Array.isArray( answer.stops ) ) {
                this.answer.stops = answer.stops;

            } else if ( ( answer.chunks > 0 ) && ( answer.interval > 0 ) ) {
                this.answer.stops = [];
                for ( let i = 0; i < answer.chunks; i++ ) {
                    this.answer.stops[ i ] = i * answer.interval;
                }

            } else {
                this.answer.wait = answer.wait || 0;
            }
        }
    }

    async response( req, res, data ) {
        const answer = this.answer;

        if ( typeof answer === 'function' ) {
            return answer( req, res, data );
        }

        if ( answer.wait > 0 ) {
            await wait_for( answer.wait );
        }

        let content = ( typeof answer.content === 'function' ) ? answer.content( req, res, data ) : answer.content;
        content = await content;

        res.statusCode = answer.status_code;
        for ( const header_name in answer.headers ) {
            res.setHeader( header_name, answer.headers[ header_name ] );
        }

        if ( typeof content === 'object' ) {
            content = JSON.stringify( content );
            set_content_type( 'application/json' );

        } else {
            content = String( content );
            set_content_type( 'text/plain' );
        }

        res.setHeader( 'content-length', Buffer.byteLength( content ) );

        res.end( content );

        function set_content_type( content_type ) {
            if ( !res.getHeader( 'content-type' ) ) {
                res.setHeader( 'content-type', content_type );
            }
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

class Route {

    constructor( answers ) {
        answers = to_array( answers );
        this.answers = answers.map( ( answer ) => new Answer( answer ) );

        this.current_answer = 0;
    }

    response( req, res, data ) {
        const answer = this.answers[ this.current_answer ];
        answer.response( req, res, data );

        this.current_answer = ( this.current_answer + 1 ) % this.answers.length;
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

class Server {

    constructor( config ) {
        this.config = config;
        this.routes = {};

        const response404 = new Answer( {
            status_code: 404,
        } );

        const handler = ( req, res ) => {
            const path = url_.parse( req.url ).pathname;

            const buffers = [];
            let received_length = 0;

            req.on( 'data', ( data ) => {
                buffers.push( data );
                received_length += data.length;
            } );

            req.on( 'end', () => {
                const data = ( received_length ) ? Buffer.concat( buffers, received_length ) : null;

                const route = this.routes[ path ];
                if ( route ) {
                    route.response( req, res, data );

                } else {
                    response404.response( req, res, data );
                }
            } );
        };

        this.server = this.config.module.createServer( this.config.options, handler );
    }

    add( path, route ) {
        this.routes[ path ] = new Route( route );
    }

    start() {
        return new Promise( ( resolve ) => {
            this.server.listen( this.config.port, resolve );
        } );
    }

    stop() {
        return new Promise( ( resolve ) => {
            this.server.close( resolve );
        } );
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

module.exports = Server;

//  ---------------------------------------------------------------------------------------------------------------  //

function to_array( value ) {
    return ( Array.isArray( value ) ) ? value : [ value ];
}

function wait_for( interval ) {
    return new Promise( ( resolve ) => {
        setTimeout( resolve, interval );
    } );
}

