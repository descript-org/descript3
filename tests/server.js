import * as url_ from 'url' ;

//  ---------------------------------------------------------------------------------------------------------------  //

class Answer {
    constructor(answer = {}) {
        if (typeof answer === 'function') {
            this.answer = answer;

        } else {
            this.answer = {};

            this.answer.statusCode = answer.statusCode || 200;
            this.answer.headers = answer.headers || {};

            this.answer.content = answer.content || null;

            this.answer.timeout = answer.timeout || 0;

            if (Array.isArray(answer.stops)) {
                this.answer.stops = answer.stops;

            } else if ((answer.chunks > 0) && (answer.interval > 0)) {
                this.answer.stops = [];
                for (let i = 0; i < answer.chunks; i++) {
                    this.answer.stops[ i ] = i * answer.interval;
                }

            } else {
                this.answer.wait = answer.wait || 0;
            }
        }
    }

    async response(req, res, data) {
        const answer = this.answer;

        if (typeof answer === 'function') {
            answer(req, res, data);

            return;
        }

        if (answer.wait > 0) {
            await waitFor(answer.wait);
        }

        let content = (typeof answer.content === 'function') ? answer.content(req, res, data) : answer.content;
        content = await content;

        //  eslint-disable-next-line require-atomic-updates
        res.statusCode = answer.statusCode;
        for (const headerName in answer.headers) {
            res.setHeader(headerName, answer.headers[ headerName ]);
        }

        if (typeof content === 'object') {
            content = JSON.stringify(content);
            setContentType('application/json');

        } else {
            content = String(content);
            setContentType('text/plain');
        }

        res.setHeader('content-length', Buffer.byteLength(content));

        res.end(content);

        function setContentType(contentType) {
            if (!res.getHeader('content-type')) {
                res.setHeader('content-type', contentType);
            }
        }
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

class Route {

    constructor(answers) {
        answers = toArray(answers);
        this.answers = answers.map((answer) => new Answer(answer));

        this.currentAnswer = 0;
    }

    response(req, res, data) {
        const answer = this.answers[ this.currentAnswer ];
        answer.response(req, res, data);

        this.currentAnswer = (this.currentAnswer + 1) % this.answers.length;
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

class Server {

    constructor(config) {
        this.config = config;
        this.routes = {};

        const response404 = new Answer({
            statusCode: 404,
        });

        const handler = (req, res) => {
            const path = url_.parse(req.url).pathname;

            const buffers = [];
            let receivedLength = 0;

            req.on('data', (data) => {
                buffers.push(data);
                receivedLength += data.length;
            });

            req.on('end', () => {
                const data = (receivedLength) ? Buffer.concat(buffers, receivedLength) : null;

                const route = this.routes[ path ];
                if (route) {
                    route.response(req, res, data);

                } else {
                    response404.response(req, res, data);
                }
            });
        };

        this.server = this.config.module.createServer(this.config.options, handler);
    }

    add(path, route) {
        this.routes[ path ] = new Route(route);
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(this.config.listen_options, resolve);
        });
    }

    stop() {
        return new Promise((resolve) => {
            this.server.close(resolve);
        });
    }

}

//  ---------------------------------------------------------------------------------------------------------------  //

export default Server;

//  ---------------------------------------------------------------------------------------------------------------  //

function toArray(value) {
    return (Array.isArray(value)) ? value : [ value ];
}

function waitFor(interval) {
    return new Promise((resolve) => {
        setTimeout(resolve, interval);
    });
}
