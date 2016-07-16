import BaseGetRouter from '../BaseGetRouter';

export default class Root extends BaseGetRouter {
    constructor(router) {
        super(router, '');
    }

    route(req, res) {
        super.route();

        res.render('index');
    }
}