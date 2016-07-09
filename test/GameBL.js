var assert = require('assert');
var should = require('should');
var mongoose = require('mongoose');
require('./Game');
require('./Person');
import * as gameUtil from '../src/classes/game/GameUtil';
import * as personBL from '../src/classes/PersonBL';

var connection = mongoose.connection;

describe('Game BL', done => {
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

  it('should create a new Game', (done) => {
    gameUtil.createGame('test game', '')
    .then(game => {
      assert.equal(game.name, 'test game');
      assert.equal(game.player('East').hand.length, 0);
      assert.equal(game.player('West').inFoot, false);
      done();
    });
  });

  it('should save and load the saved game', done => {
    let _game = {};
    gameUtil.createGame('test game', '')
    .then(game => {
      _game = game;
      return game.save();
    })
    .then(() => {
      should.exist(_game.id);
      return gameUtil.loadGame(_game.id);
    })
    .then(game => {
      should.exist(game)
      game.name.should.equal('test game');
      done();
    })
    .catch(err => {
      console.log(err.stack);
      should.not.exist(err);
      done();
    });
  });

  it('should deal a new hand', done => {
    gameUtil.createGame('test game', '')
    .then(game => {
      game.dealNewHand();
      game.player('North').hand.length.should.equal(11);
      game.pile('East').cards.length.should.equal(59);
      game.pile('Discard').cards.length.should.equal(0);
      done();
    })
    .catch(err => {
      console.log(err.stack);
    })
  });

  it('should start a new hand', done => {
    gameUtil.createGame('test game', '')
    .then(game => {
      game.startNewHand();
      let gameVM = game.deserialize();
      gameVM.gameBegun.should.equal(true);
      gameVM.turnState.should.equal('draw1');
      done();
    })
    .catch(err => {
      console.log(err.stack);
      done();
    })
  });

  it('should add a player and then turn off connected', done => {
    let _game = {};
    var person = new personBL.Person('test name', 'user id', 'password');
    person.save()
    .then(() => {
      return gameUtil.createGame('test game', '');
    })
    .then(game => {
      _game = game;
      return game.save();
    })
    .then(() => {
      return gameUtil.loadGame(_game.id);
    })
    .then(game1 => {
      _game = game1;
      _game.name.should.equal('test game');

      return _game.addPlayer(person.id, 'North');
    })
    .then(() => {
      var player = _game.player('North');
      player.connected.should.equal(true);

      return gameUtil.turnOffConnected(person.id);
    })
    .then(() => {
      return gameUtil.loadGame(_game.id);
    })
    .then(gameReload => {
      gameReload.player('North').connected.should.equal(false);
      done();
    })
    .catch(err => {
      console.log(err.stack);
      should.not.exist(err);
      done();
    });
  });

  it('should find incomplete games', (done) => {
    gameUtil.createGame('test game', '')
    .then(game => {
      return game.save();
    })
    .then(() => {
      return gameUtil.findIncompleteGames();
    })
    .then(games => {
      games.length.should.equal(1);
      done();
    })
    .catch(err => {
      console.log(err)
      should.not.exist(err.stack);
      done();
    });
  });

  it('should return stats', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            let DbGame = mongoose.model('Game');
            var dbGame = new DbGame({name: 'test stats'});
            let player1 = { person: [personNorth._id], direction: 'North', handCards: [], footCards: []};
            let player2 = { person: [personSouth._id], direction: 'South', handCards: [], footCards: []};
            let player3 = { person: [personEast._id], direction: 'East', handCards: [], footCards: []};
            let player4 = { person: [personWest._id], direction: 'West', handCards: [], footCards: []};
            let team1 = { score: 100, players: [player1, player2]};
            let team2 = { score: 200, players: [player3, player4]};

            dbGame.nsTeam.push(team1);
            dbGame.ewTeam.push(team2);
            dbGame.piles = [
              { direction: 'North', cards: [] },
              { direction: 'East', cards: [] },
              { direction: 'South', cards: [] },
              { direction: 'West', cards: [] },
              { direction: 'Discard', cards: [] }
            ];

            gameUtil.createGame(dbGame)
            .then(game => {
              let results = game.buildStats('North', true, false);
              results.stat.yourTeam.partner.name.should.equal(personSouth.name);
              results.stat.theirTeam.player1.name.should.equal(personEast.name);
              results.stat.theirTeam.player2.name.should.equal(personWest.name);
              results.stat.yourTeam.score.should.equal(-99999);
              results.stat.theirTeam.score.should.equal(200);
              results.stat.status.should.equal('loss');

              results = game.buildStats('South', false, true);
              results.stat.yourTeam.partner.name.should.equal(personNorth.name);
              results.stat.theirTeam.player1.name.should.equal(personEast.name);
              results.stat.theirTeam.player2.name.should.equal(personWest.name);
              results.stat.yourTeam.score.should.equal(100);
              results.stat.theirTeam.score.should.equal(-99999);
              results.stat.status.should.equal('win');

              results = game.buildStats('East', false, false);
              results.stat.yourTeam.partner.name.should.equal(personWest.name);
              results.stat.theirTeam.player1.name.should.equal(personNorth.name);
              results.stat.theirTeam.player2.name.should.equal(personSouth.name);
              results.stat.yourTeam.score.should.equal(200);
              results.stat.theirTeam.score.should.equal(100);
              results.stat.status.should.equal('win');

              dbGame.ewTeam[0].score = 100;
              results = game.buildStats('West', false, false);
              results.stat.yourTeam.partner.name.should.equal(personEast.name);
              results.stat.theirTeam.player1.name.should.equal(personNorth.name);
              results.stat.theirTeam.player2.name.should.equal(personSouth.name);
              results.stat.yourTeam.score.should.equal(100);
              results.stat.theirTeam.score.should.equal(100);
              results.stat.status.should.equal('tie');
              done();
            })
            .catch(err => {
              console.log(err.stack);
            })
          });
        });
      });
    });
  });
});
