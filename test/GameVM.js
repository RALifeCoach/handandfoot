var assert = require('assert');
var should = require('should');
import mongoose from 'mongoose';
require('./Game');
require('./Person');
import * as gameUtil from '../src/classes/game/GameUtil';
import * as personBL from '../src/classes/PersonBL';
import * as GameVM from '../src/viewmodels/GameVM';
import * as TestUtils from '../testSupport/testUtils';

describe('Game VM', done => {
  let mapper = new GameVM.GameVM();
  beforeEach(done => {
    TestUtils.dbBefore(done);
  });

  afterEach(done => {
    TestUtils.dbAfter(done);
  });

  it('should create a new Game and map to VM', (done) => {
    gameUtil.createGame('test game', '')
    .then(game => {
      let gameVM = game.deserialize(game);
      gameVM.name.should.equal('test game');
      gameVM.players[0].should.equal(false);
      done();
    });
  });

  it('should find incomplete games', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    gameUtil.createGame('test game', '')
    .then(game => {
      return game.save();
    })
    .then(() => {
      return mapper.getAllIncompleteGames(dbPerson._id);
    })
    .then(gamesVM => {
      gamesVM.length.should.equal(1);
      done();
    })
    .catch(err => {
      console.log(err.stack)
      should.not.exist(err.stack);
      done();
    });
  });

  it('should add a new player', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, person) => {
      gameUtil.createGame('test game', '')
      .then(game => {
        return game.save();
      })
      .then(game => {
        return mapper.addPlayer(game.id, dbPerson._id, 'North');
      })
      .then(game => {
        game.player('North').personId.should.equal(dbPerson._id);
        game.person('North').name.should.equal('test north');
        done();
      })
      .catch(err => {
        console.log(err.stack)
        should.not.exist(err.stack);
        done();
      });
    });
  });

  it('should start a new game', done => {
    let _results;
    TestUtils.gameAndFourPlayers()
    .then(results => {
      _results = results;
      return mapper.addPlayer(results.game.id, results.north.id, 'North');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.south.id, 'South');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.east.id, 'East');
    })
    .then(game => {
      game.player('North').hand.length.should.equal(0);
      return mapper.addPlayer(_results.game.id, _results.west.id, 'West');
    })
    .then(game => {
      game.person('North').name.should.equal('test north');
      game.person('South').name.should.equal('test south');
      game.person('East').name.should.equal('test east');
      game.person('West').name.should.equal('test west');
      game.player('North').hand.length.should.equal(11);
      done();
    })
    .catch(err => {
      console.log(err.stack);
      done();
    });
  });

  it('should apply non-turn updates to the game and return the updated game', done => {
    let _results;
    TestUtils.gameAndFourPlayers()
    .then(results => {
      _results = results;
      return mapper.addPlayer(results.game.id, results.north.id, 'North');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.south.id, 'South');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.east.id, 'East');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.west.id, 'West');
    })
    .then(game => {
      let playerVM = TestUtils.buildPlayer(false);
      let meldsVM = TestUtils.buildCompleteMelds();
      let action = false;
      let control = {
        turnState: 'draw1',
        hasMelds: false,
        drawCards: 0,
        pointsNeeded: 50,
        pointsSoFar: 0,
        endHand: false,
        highlightedScore: 0,
        gameMessages: [],
        callInProgress: false
      };

      game.player('North').footCards.length.should.equal(11);
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      game.player('North').footCards.length.should.equal(1);
      game.player('North').handCards.length.should.equal(1);
      game.pile('North').cards.length.should.equal(59);
      game.pile('South').cards.length.should.equal(59);
      game.pile('East').cards.length.should.equal(59);
      game.pile('West').cards.length.should.equal(59);
      game.pile('Discard').cards.length.should.equal(0);
      done();
    })
    .catch(err => {
      console.log('catch');
      console.log(err.stack)
      done();
    });
  });

  it('should apply turn updates and return the updated game', (done) => {
    let _results;
    TestUtils.gameAndFourPlayers()
    .then(results => {
      _results = results;
      return mapper.addPlayer(results.game.id, results.north.id, 'North');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.south.id, 'South');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.east.id, 'East');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.west.id, 'West');
    })
    .then(game => {
      let playerVM = TestUtils.buildPlayer(true);
      let meldsVM = TestUtils.buildCompleteMelds();
      let action = false;
      let control = {
        turnState: 'xxxxx',
        hasMelds: false,
        drawCards: 1,
        pointsNeeded: 50,
        pointsSoFar: 0,
        endHand: false,
        highlightedScore: 100,
        gameMessages: [],
        callInProgress: false
      };

      mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control)
      .then(results => {
        let game = results.game;
        game.player('North').footCards.length.should.equal(1);
        game.player('North').handCards.length.should.equal(1);
        game.pile('North').cards.length.should.equal(59);
        game.pile('South').cards.length.should.equal(59);
        game.pile('East').cards.length.should.equal(59);
        game.pile('West').cards.length.should.equal(59);
        game.pile('Discard').cards.length.should.equal(0);
        let gameVM = game.deserialize();
        gameVM.turnState.should.equal('xxxxx');
        gameVM.drawCards.should.equal(1);
        done();
      });
    })
    .catch(err => {
      console.log('catch');
      console.log(err.stack)
      should.not.exist(err.stack);
      done();
    });
  });

  it('should apply draw card to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let playerVM = TestUtils.buildPlayer(true);
    let meldsVM = TestUtils.buildCompleteMelds();
    let action = {
      action: 'drawCard',
      pileIndex: 0
    };
    let control = {
      turnState: 'draw1',
      hasMelds: false,
      drawCards: 0,
      pointsNeeded: 50,
      pointsSoFar: 0,
      endHand: false,
      highlightedScore: 0,
      gameMessages: [],
      callInProgress: false
    };

    let _results;
    TestUtils.gameAndFourPlayers()
    .then(results => {
      _results = results;
      return mapper.addPlayer(results.game.id, results.north.id, 'North');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.south.id, 'South');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.east.id, 'East');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.west.id, 'West');
    })
    .then(game => {
      game.player('North').footCards.length.should.equal(11);
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      game.player('North').footCards.length.should.equal(1);
      game.player('North').handCards.length.should.equal(2);
      game.pile('North').cards.length.should.equal(58);
      game.pile('South').cards.length.should.equal(59);
      game.pile('East').cards.length.should.equal(59);
      game.pile('West').cards.length.should.equal(59);
      game.pile('Discard').cards.length.should.equal(0);
      let gameVM = game.deserialize();
      gameVM.turnState.should.equal('draw2');
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      game.player('North').footCards.length.should.equal(1);
      game.player('North').handCards.length.should.equal(2);
      game.pile('North').cards.length.should.equal(57);
      game.pile('South').cards.length.should.equal(59);
      game.pile('East').cards.length.should.equal(59);
      game.pile('West').cards.length.should.equal(59);
      game.pile('Discard').cards.length.should.equal(0);
      let gameVM = game.deserialize();
      gameVM.turnState.should.equal('play');
      let control = {
        turnState: 'draw3',
        hasMelds: false,
        drawCards: 1,
        pointsNeeded: 50,
        pointsSoFar: 0,
        endHand: false,
        highlightedScore: 0,
        gameMessages: [],
        callInProgress: false
      };
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let gameVM = results.game.deserialize();
      gameVM.turnState.should.equal('play');
      gameVM.drawCards.should.equal(0);
      done();
    })
    .catch(err => {
      console.log('catch');
      console.log(err.stack)
      should.not.exist(err.stack);
      done();
    });
  });

  it('should action discard card to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let playerVM = TestUtils.buildPlayer(true);
    let meldsVM = TestUtils.buildCompleteMelds();
    let action = {
      action: 'discardCard',
      cardIndex: 0
    };
    let control = {
      turnState: 'draw1',
      hasMelds: false,
      drawCards: 0,
      pointsNeeded: 50,
      pointsSoFar: 0,
      endHand: false,
      highlightedScore: 0,
      gameMessages: [],
      callInProgress: false
    };

    let _results;
    TestUtils.gameAndFourPlayers()
    .then(results => {
      _results = results;
      return mapper.addPlayer(results.game.id, results.north.id, 'North');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.south.id, 'South');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.east.id, 'East');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.west.id, 'West');
    })
    .then(game => {
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      game.player('North').footCards.length.should.equal(1);
      game.player('North').handCards.length.should.equal(0);
      game.pile('North').cards.length.should.equal(59);
      game.pile('South').cards.length.should.equal(59);
      game.pile('East').cards.length.should.equal(59);
      game.pile('West').cards.length.should.equal(59);
      game.pile('Discard').cards.length.should.equal(1);
      let gameVM = game.deserialize();
      game.player('North').player.turn = false;
      done();
    })
    .catch(err => {
      console.log('catch');
      console.log(err.stack)
      should.not.exist(err.stack);
      done();
    });
  });

  it('should action draw 7 cards to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let playerVM = TestUtils.buildPlayer(true);
    let meldsVM = TestUtils.buildCompleteMelds();
    let action = {
      action: 'discardCard',
      cardIndex: 0
    };
    let control = {
      turnState: 'draw1',
      hasMelds: false,
      drawCards: 0,
      pointsNeeded: 50,
      pointsSoFar: 0,
      endHand: false,
      highlightedScore: 0,
      gameMessages: [],
      callInProgress: false
    };

    let _results;
    TestUtils.gameAndFourPlayers()
    .then(results => {
      _results = results;
      return mapper.addPlayer(results.game.id, results.north.id, 'North');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.south.id, 'South');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.east.id, 'East');
    })
    .then(game => {
      return mapper.addPlayer(_results.game.id, _results.west.id, 'West');
    })
    .then(game => {
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      game.player('North').handCards.length.should.equal(0);
      game.pile('Discard').cards.length.should.equal(3);
      let action = {
        action: 'drawSevenCards'
      };
      return mapper.updateGame(game.id,
        playerVM,
        meldsVM,
        action,
        control);
    })
    .then(results => {
      let game = results.game;
      game.pile('Discard').cards.length.should.equal(0);
      game.player('North').handCards.length.should.equal(3);
      done();
    })
    .catch(err => {
      console.log('catch');
      console.log(err.stack)
      should.not.exist(err.stack);
      done();
    });
  });
});
