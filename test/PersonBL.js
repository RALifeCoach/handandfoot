var assert = require('assert');
var should = require('should');
var mongoose = require('mongoose');
require('./Person');
import * as personBL from '../src/classes/PersonBL';

var connection = mongoose.connection;

describe('Person BL', () => {
  beforeEach(done => {
    function clearDB() {
      let collectionCtr = 0;
      for (var i in connection.collections) {
        collectionCtr++;
        connection.collections[i].remove(function() {
          if (--collectionCtr === 0)
            return done();
        });
      }
      if (collectionCtr === 0) {
        return done();
      }
    }

    if (connection.readyState === 0) {
      mongoose.connect('mongodb://localhost/test', function (err) {
        if (err) {
          throw err;
        }
        return clearDB();
      });
    } else {
      return clearDB();
    }
  });

  afterEach(function (done) {
    mongoose.disconnect();
    return done();
  });

  it('should create a new Person', () => {
    var person = new personBL.Person('test name', 'user id', 'password');
    assert.equal(person.name, 'test name');
    assert.equal(person.person.userId, 'user id');
    assert.equal(person.person.password, 'password');
  });

  it('should save and load the saved person', (done) => {
    var person = new personBL.Person('test name', 'user id', 'password');
    person.save()
    .then(() => {
      return personBL.loadPerson(person.id);
    })
    .then(personLoaded => {
      should.exist(personLoaded);
      personLoaded.name.should.equal('test name');
      done();
    })
    .catch(err => {
      should.not.exist(err);
      done();
    });
  });

  it('should sign in successfully', (done) => {
    var person = new personBL.Person('test name', 'user id', 'password');
    person.save()
    .then(savedPerson => {
      should.exist(savedPerson._id);
      return personBL.signin('user id', 'password');
    })
    .then(personLoaded => {
      should.exist(personLoaded);
      personLoaded.name.should.equal('test name');
      done();
    })
    .catch(err => {
      console.log(err.stack);
      should.not.exist(err);
      done();
    });
  });

  it('should fail to sign in', (done) => {
    var person = new personBL.Person('test name', 'user id', 'password');
    person.save()
    .then(savedPerson => {
      should.exist(savedPerson._id);
      return personBL.signin('user id', 'passwordx');
    })
    .then(personLoaded => {
      should.not.exist(personLoaded);
      personLoaded.name.should.equal('test name');
      done();
    })
    .catch(err => {
      should.exist(err);
      done();
    });
  });
});
