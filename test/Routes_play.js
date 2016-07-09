var should = require('should');
import mongoose from 'mongoose';
require('./Game');
require('./Person');
import * as mockSocket from '../testSupport/mockSocket';
import * as PlayGame from '../src/classes/PlayGame';
import * as Play from '../src/routes/play';
import * as TestUtils from '../testSupport/testUtils';
import * as GameVM from '../src/viewmodels/GameVM';

describe("route play", () => {
  let playGame = {},
    io = {},
    play = {};
  beforeEach(done => {
    io = new mockSocket.Io();
    TestUtils.dbBefore(done);
  });

  afterEach(done => {
    TestUtils.dbAfter(done);
  });

  it("should handle socket.on calls", () => {
    new Play.Router(io, playGame);
    io.call('updateGame').should.be.a.function;
  });

  it("should handle joinGame message", done => {
    TestUtils.gameAndFourPlayers()
    .then(results => {
      let data = {
        personId: results.north._id,
        direction: 'North',
        personName: results.north.name,
        socketId: results.north._id,
        gameId: results.game.id
      };
      playGame = {
        newConnectedPlayer: function(socket, data) {
          return true;
        },
        findCreateConnectedGame(socket, data) {
          return {
            sendMessages: function(game, socket) {
              game.player('North').should.be.an.object;
              done();
            }
          }
        }
      };
      new Play.Router(io, playGame);
      io.call('joinGame')(data);
    })
  });

  it("should handle updateGame message", done => {
    let mapper = new GameVM.GameVM();
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
      playGame = {
        newConnectedPlayer: function(socket, data) {
          return true;
        },
        findConnectedPlayer(socket, data) {
          return {
            gameId: game.id
          }
        },
        findConnectedGame: function(socket, connectedPlayer) {
          return {
            sendMessages: function(gameVM, socket) {
              gameVM.players[0].footCards.cards.length.should.equal(1);
              gameVM.players[0].handCards.cards.length.should.equal(2);
              gameVM.piles[0].cards.length.should.equal(58);
              gameVM.piles[1].cards.length.should.equal(59);
              gameVM.piles[2].cards.length.should.equal(59);
              gameVM.piles[3].cards.length.should.equal(59);
              gameVM.piles[4].cards.length.should.equal(0);
              gameVM.turnState.should.equal('draw2');
              done();
            }
          }
        }
      };
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
      let data = {
        player: playerVM,
        melds: meldsVM,
        action: action,
        control: control
      };

      new Play.Router(io, playGame);

      io.call('updateGame')(data, () => { done() });
    })
    .catch(err => {
      console.log(err.stack);
    });
  });
});
