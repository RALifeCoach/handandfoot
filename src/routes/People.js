import express from 'express';
import Base from '../classes/Base';
import Root from './peopleRoutes/Root';
import Login from './peopleRoutes/Login';
import Register from './peopleRoutes/Register';

export default class People extends Base {
    constructor() {
        super();
        const router = express.Router();
        this.routes = [];

        this.routes.push(new Root(router));
        this.routes.push(new Login(router));
        this.routes.push(new Register(router));

        return router;
    }
}
