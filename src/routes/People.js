import express from 'express';
import * as PersonVM from '../viewmodels/PersonVM';
import mongoose from 'mongoose';

export default class People {
    constructor() {
        const router = express.Router();
        const mapper = new PersonVM.PersonVM();
        var Person = mongoose.model('Person');

        /* GET home page. */
        router.get('/', (req, res) => {
            res.render('index');
        });

        router.post('/login', (req, res, next) => {
            var userId = req.body.userId.toLowerCase();
            var query = Person.findOne({userId: userId});
            query.exec(function (err, person) {
                if (err) {
                    return next(err);
                }
                if (!person) {
                    console.log('user not found');
                    console.log(req.body);
                    res.json({error: true});
                    return;
                }

                if (person.password !== req.body.password) {
                    console.log('password does not match');
                    console.log(req.body);
                    console.log(person);
                    res.json({error: true});
                    return;
                }

                res.json({error: false, person: mapper.mapToVM(person)});
            });
        });

        router.post('/register', (req, res, next) => {
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
                res.json({error: false, person: mapper.mapToVM(person)});
            });
        });

        return router;
    }
}
