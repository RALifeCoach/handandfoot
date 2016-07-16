import BaseRouter from '../BasePostRouter';
import mongoose from 'mongoose';
import PersonVM from '../../viewmodels/PersonVM';

export default class Register extends BaseRouter {
    constructor(router) {
        super(router, 'register');
    }

    route(req, res, next) {
        super.route();

        const Person = mongoose.model('Person');

        var query = Person.findOne({userId: req.body.userId});

        if (req.body.password !== req.body.confirmPassword) {
            res.json({error: 'password and confirm password do not agree'});
            return;
        }

        if (req.body.password.length < 2) {
            res.json({error: 'password must be at least 6 characters long'});
            return;
        }

        query.exec(function (err, person) {
            if (err) {
                return next(err);
            }
            if (person) {
                res.json({error: 'user id already exists'});
                return;
            }

            person = new Person(req.body);
            person.userId = person.userId.toLowerCase();
            person.save();
            res.json({error: false, person: PersonVM.mapToVM(person)});
        });
    }
}