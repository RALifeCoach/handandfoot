import BasePostRouter from '../BasePostRouter';
import PersonVM from '../../viewmodels/PersonVM';
import mongoose from 'mongoose';

export default class Login extends BasePostRouter {
    constructor(router) {
        super(router, 'login');
    }

    route(req, res, next) {
        super.route();

        const Person = mongoose.model('Person');

        const userId = req.body.userId.toLowerCase();
        const query = Person.findOne({userId: userId});
        query.exec((function (err, person) {
            if (err) {
                return next(err);
            }
            if (!person) {
                this.logger.warn('user not found');
                this.logger.warn(req.body);
                res.json({error: true});
                return;
            }

            if (person.password !== req.body.password) {
                this.logger.warn('password does not match');
                this.logger.warn(req.body);
                this.logger.warn(person);
                res.json({error: true});
                return;
            }

            res.json({
                error: false,
                person: PersonVM.mapToVM(person)
            });
        }).bind(this));
    }
}