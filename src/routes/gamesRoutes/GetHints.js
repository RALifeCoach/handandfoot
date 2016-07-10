import BaseRouter from '../BaseRouter';
import mongoose from 'mongoose';

export default class GetHints extends BaseRouter {
    constructor(router) {
        super(router, 'getHints');
        this.Hint = mongoose.model('Hint');
    }
    
    route(req, res, next) {
        super.route();

        this.Hint.find(function (err, hints) {
            res.json(hints);
        });
    }
}