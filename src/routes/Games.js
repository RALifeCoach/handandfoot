import express from 'express';
import Base from '../classes/Base';
import GetAll from './gamesRoutes/GetAll';
import ShowScores from './gamesRoutes/ShowScores';
import GetHints from './gamesRoutes/GetHints';
import GetHelp from './gamesRoutes/GetHelp';
import Root from './gamesRoutes/Root';

export default class Games extends Base {
    constructor(io) {
        super();
        this.routes = [];
        io.on('connection', (() => {
            this.logger.info('game connection');
        }).bind(this));

        var router = express.Router();

        this.routes.push(new GetAll(router));
        this.routes.push(new ShowScores(router));
        this.routes.push(new GetHints(router));
        this.routes.push(new GetHelp(router));
        this.routes.push(new Root(router, io));

        return router;
    }
}
