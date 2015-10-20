var assert = require('assert');
var should = require('should');
import mongoose from 'mongoose';
require('../models/Game');
require('../models/Person');
import * as gameUtil from '../classes/game/GameUtil';
import * as personBL from '../classes/PersonBL';
import * as GameVM from '../viewmodels/GameVM';
//import * as dbUtil from '../testSupport/DbUtil';

describe('Game VM', done => {
  let mapper = new GameVM.GameVM();
  beforeEach(done => {
    function clearDB() {
      let collectionCtr = 0;
      for (var i in mongoose.connection.collections) {
        collectionCtr++;
        mongoose.connection.collections[i].remove(function() {
          if (--collectionCtr === 0)
            return done();
        });
      }
      if (collectionCtr === 0) {
        return done();
      }
    }

    if (mongoose.connection.readyState === 0) {
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

  afterEach(done => {
    mongoose.disconnect();
    done();
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

  it('should start a new game', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              return mapper.addPlayer(game.id, personNorth._id, 'North');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personSouth._id, 'South');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personEast._id, 'East');
            })
            .then(game => {
              game.player('North').hand.length.should.equal(0);
              return mapper.addPlayer(game.id, personWest._id, 'West');
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
              console.log(err.stack)
              should.not.exist(err.stack);
              done();
            });
          });
        });
      });
    });
  });

  it('should apply non-turn updates to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              return mapper.addPlayer(game.id, personNorth._id, 'North');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personSouth._id, 'South');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personEast._id, 'East');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personWest._id, 'West');
            })
            .then(game => {
              let playerVM = buildPlayer(false);
              let meldsVM = buildCompleteMelds();
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
              mapper.updateGame(game.id,
                playerVM,
                meldsVM,
                action,
                control,
                (err, game, results) => {
                  game.player('North').footCards.length.should.equal(1);
                  game.player('North').handCards.length.should.equal(1);
                  game.pile('North').cards.length.should.equal(59);
                  game.pile('South').cards.length.should.equal(59);
                  game.pile('East').cards.length.should.equal(59);
                  game.pile('West').cards.length.should.equal(59);
                  game.pile('Discard').cards.length.should.equal(0);
                  done();
                }
              );
            })
            .catch(err => {
              console.log('catch');
              console.log(err.stack)
              should.not.exist(err.stack);
              done();
            });
          });
        });
      });
    });
  });

  it('should apply turn updates and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              return mapper.addPlayer(game.id, personNorth._id, 'North');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personSouth._id, 'South');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personEast._id, 'East');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personWest._id, 'West');
            })
            .then(game => {
              let playerVM = buildPlayer(true);
              let meldsVM = buildCompleteMelds();
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
                control,
                (err, game, results) => {
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
                }
              );
            })
            .catch(err => {
              console.log('catch');
              console.log(err.stack)
              should.not.exist(err.stack);
              done();
            });
          });
        });
      });
    });
  });

  it('should apply draw card to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              return mapper.addPlayer(game.id, personNorth._id, 'North');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personSouth._id, 'South');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personEast._id, 'East');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personWest._id, 'West');
            })
            .then(game => {
              let playerVM = buildPlayer(true);
              let meldsVM = buildCompleteMelds();
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

              game.player('North').footCards.length.should.equal(11);
              mapper.updateGame(game.id,
                playerVM,
                meldsVM,
                action,
                control,
                (err, game, results) => {
                  game.player('North').footCards.length.should.equal(1);
                  game.player('North').handCards.length.should.equal(2);
                  game.pile('North').cards.length.should.equal(58);
                  game.pile('South').cards.length.should.equal(59);
                  game.pile('East').cards.length.should.equal(59);
                  game.pile('West').cards.length.should.equal(59);
                  game.pile('Discard').cards.length.should.equal(0);
                  let gameVM = game.deserialize();
                  gameVM.turnState.should.equal('draw2');
                  mapper.updateGame(game.id,
                    playerVM,
                    meldsVM,
                    action,
                    control,
                    (err, game, results) => {
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
                      mapper.updateGame(game.id,
                        playerVM,
                        meldsVM,
                        action,
                        control,
                        (err, game, results) => {
                          let gameVM = game.deserialize();
                          gameVM.turnState.should.equal('play');
                          gameVM.drawCards.should.equal(0);
                          done();
                        }
                      );
                    }
                  );
                }
              );
            })
            .catch(err => {
              console.log('catch');
              console.log(err.stack)
              should.not.exist(err.stack);
              done();
            });
          });
        });
      });
    });
  });

  it('should action discard card to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              return mapper.addPlayer(game.id, personNorth._id, 'North');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personSouth._id, 'South');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personEast._id, 'East');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personWest._id, 'West');
            })
            .then(game => {
              let playerVM = buildPlayer(true);
              let meldsVM = buildCompleteMelds();
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

              game.player('North').footCards.length.should.equal(11);
              mapper.updateGame(game.id,
                playerVM,
                meldsVM,
                action,
                control,
                (err, game, results) => {
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
                }
              );
            });
          });
        });
      });
    });
  });

  it('should action draw 7 cards to the game and return the updated game', (done) => {
    let DbPerson = mongoose.model('Person');
    let dbPerson = new DbPerson({name: 'test north'});
    dbPerson.save((err, personNorth) => {
      let dbPerson = new DbPerson({name: 'test south'});
      dbPerson.save((err, personSouth) => {
        let dbPerson = new DbPerson({name: 'test east'});
        dbPerson.save((err, personEast) => {
          let dbPerson = new DbPerson({name: 'test west'});
          dbPerson.save((err, personWest) => {
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              return mapper.addPlayer(game.id, personNorth._id, 'North');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personSouth._id, 'South');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personEast._id, 'East');
            })
            .then(game => {
              return mapper.addPlayer(game.id, personWest._id, 'West');
            })
            .then(game => {
              let playerVM = buildPlayer(true);
              let meldsVM = buildCompleteMelds();
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

              mapper.updateGame(game.id,
                playerVM,
                meldsVM,
                action,
                control,
                (err, game, results) => {
                  mapper.updateGame(game.id,
                    playerVM,
                    meldsVM,
                    action,
                    control,
                    (err, game, results) => {
                      mapper.updateGame(game.id,
                        playerVM,
                        meldsVM,
                        action,
                        control,
                        (err, game, results) => {
                          game.player('North').handCards.length.should.equal(0);
                          game.pile('Discard').cards.length.should.equal(3);
                          let action = {
                            action: 'drawSevenCards'
                          };
                          mapper.updateGame(game.id,
                            playerVM,
                            meldsVM,
                            action,
                            control,
                            (err, game, results) => {
                              game.pile('Discard').cards.length.should.equal(0);
                              game.player('North').handCards.length.should.equal(3);
                              done();
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            });
          });
        });
      });
    });
  });
});

function buildPlayer(turn) {
  return {
    direction: 'North',
    connected: true,
    turn: turn,
    footCards: [
      {
        suitNumber: 0,
        cardNumber: 2,
        suitCard: 'clubs',
        number: '4',
        highlight: false
      },
    ],
    handCards: [
      {
        suitNumber: 0,
        cardNumber: 2,
        suitCard: 'clubs',
        number: '4',
        highlight: false
      },
    ],
    inFoot: false,
    myUpdate: true
  };
}

function buildCompleteMelds(redThree, clean, dirty, run, wild) {
  let melds = [];
  if (redThree) {
    for (let meldIndex = 0; meldIndex < redThree; meldIndex++) {
      melds.push({
        type: 'Red Three',
        number: 0,
        isComplete: true,
        cards: []
      })
    }
  }
  if (clean) {
    for (let meldIndex = 0; meldIndex < clean; meldIndex++) {
      melds.push({
        type: 'Clean Meld',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }
  if (dirty) {
    for (let meldIndex = 0; meldIndex < dirty; meldIndex++) {
      melds.push({
        type: 'Dirty Meld',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }
  if (run) {
    for (let meldIndex = 0; meldIndex < run; meldIndex++) {
      melds.push({
        type: 'Run',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }
  if (wild) {
    for (let meldIndex = 0; meldIndex < wild; meldIndex++) {
      melds.push({
        type: 'Wild Card Meld',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }

  return melds;
}

function buildInCompleteMelds(melds, clean, dirty, run, wild) {
  if (clean) {
    for (let meldIndex = 0; meldIndex < clean; meldIndex++) {
      melds.push({
        type: 'Clean Meld',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
  if (dirty) {
    for (let meldIndex = 0; meldIndex < dirty; meldIndex++) {
      melds.push({
        type: 'Dirty Meld',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
  if (run) {
    for (let meldIndex = 0; meldIndex < run; meldIndex++) {
      melds.push({
        type: 'Run',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
  if (wild) {
    for (let meldIndex = 0; meldIndex < wild; meldIndex++) {
      melds.push({
        type: 'Wild Card Meld',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
}
