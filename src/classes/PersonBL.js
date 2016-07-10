import mongoose from 'mongoose';

export default class PersonBL {
    constructor() {
        const DbPerson = mongoose.model('Person');

        if (arguments.length === 1) { // create from existing data
            this.person = arguments[0];
        } else { // create new person
            this.person = new DbPerson();
            this.person.name = arguments[0];
            this.person.userId = arguments[1];
            this.person.password = arguments[2];
        }
    }

    get id() {
        return this.person._id
    }

    get name() {
        return this.person.name
    }

    save() {
        return new Promise((resolve, reject) => {
            this.person.save((err, savedPerson) => {
                if (err) {
                    console.log(err.stack);
                    reject(err);
                }

                this.person = savedPerson;
                resolve(this.person);
            });
        });
    }

    addStats(stat) {
        return new Promise((resolve, reject) => {
            this.person.stats.push(stat);
            this.save()
                .then(savedPerson => {
                    resolve(savedPerson);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
    static loadPerson(personId) {
        const DbPerson = mongoose.model('Person');

        return new Promise((resolve, reject) => {
            DbPerson.findById(personId, (err, person) => {
                if (err) {
                    console.log(err.stack);
                    return reject(err);
                }

                if (!person) {
                    const except = new Error('Person not found by id');
                    console.log(personId);
                    console.log(except.stack);
                    return reject(except);
                }

                resolve(new Person(person));
            });
        });
    }
}

export function signin(userId, password) {
    const DbPerson = mongoose.model('Person');

    return new Promise((resolve, reject) => {
        DbPerson.findOne({userId: userId, password: password}, (err, person) => {
            if (err) {
                console.log(err.stack);
                return reject(err);
            }

            if (!person) {
                const except = new Error('Person not found by user id and password');
                console.log(except.stack);
                return reject(except);
            }

            resolve(new Person(person));
        });
    });
}
