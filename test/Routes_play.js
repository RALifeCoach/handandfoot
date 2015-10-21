var should = require('should');
import mongoose from 'mongoose';
require('../models/Game');
require('../models/Person');
import * as mockSocket from '../testSupport/mockSocket';
import * as PlayGame from '../classes/playGame';
import * as Play from '../routes/play';
import * as TestUtils from '../testSupport/testUtils';

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
    TestUtils.gameAndFourPlayers()
    .then(results => {
      playGame = {
        newConnectedPlayer: function(socket, data) {
          return true;
        },
        findCreateConnectedGame(socket, data) {
          return {
            sendMessages: function(game, socket) {
              game.player('North').footCards.length.should.equal(1);
              game.player('North').handCards.length.should.equal(2);
              game.pile('North').cards.length.should.equal(58);
              game.pile('South').cards.length.should.equal(59);
              game.pile('East').cards.length.should.equal(59);
              game.pile('West').cards.length.should.equal(59);
              game.pile('Discard').cards.length.should.equal(0);
              let gameVM = game.deserialize();
              gameVM.turnState.should.equal('draw2');
              done();
            },
            gameId: results.game.id
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
      data = {
        player: playerVM,
        melds: meldsVM,
        action: action,
        control: control
      };

      io.call('updateGame', data);
    })
  });
});
