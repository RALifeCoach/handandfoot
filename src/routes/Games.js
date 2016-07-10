import express from 'express';
import Bunyan from 'bunyan';
import GetAll from './gamesRoutes/GetAll';
import ShowScores from './gamesRoutes/ShowScores';
import GetHints from './gamesRoutes/GetHints';
import GetHelp from './gamesRoutes/GetHelp';
import Root from './gamesRoutes/Root';

export default class Games {
    constructor(io) {
        this.logger = Bunyan.createLogger({
            name: 'Games Router'
        });
        this.routes = [];
        io.on('connection', function () {
            this.logger.info('game connection');
        });

        var router = express.Router();

        this.routes.push(new GetAll(router));
        this.routes.push(new ShowScores(router));
        this.routes.push(new GetHints(router));
        this.routes.push(new GetHelp(router));
        this.routes.push(new Root(router, io));

        return router;
    }
}
