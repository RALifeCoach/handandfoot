import BaseGetRouter from '../BaseGetRouter';
import mongoose from 'mongoose';

export default class GetHints extends BaseGetRouter {
    constructor(router) {
        super(router, 'getHints');
        this.Hint = mongoose.model('Hint');
    }
    
    route(req, res) {
        super.route();

        this.Hint.find(function (err, hints) {
            res.json(hints);
        });
    }
}