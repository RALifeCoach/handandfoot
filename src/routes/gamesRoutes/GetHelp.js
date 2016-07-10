import BaseRouter from '../BaseRouter';
import mongoose from 'mongoose';

export default class GetHelp extends BaseRouter {
    constructor(router) {
        super(router, 'getHints');
        this.HelpText = mongoose.model('HelpText');
    }
    
    route(req, res, next) {
        super.route();

        this.HelpText.find(function (err, help) {
            if (err) {
                this.logger.fatal(err);
                return next(err);
            }

            res.json(help[0]);
        });
    }
}