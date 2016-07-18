'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.createGameClass = createGameClass;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _TeamBL = require('../TeamBL');

var _TeamBL2 = _interopRequireDefault(_TeamBL);

var _PlayerBL = require('../PlayerBL');

var _PlayerBL2 = _interopRequireDefault(_PlayerBL);

var _PersonBL = require('../PersonBL');

var _PersonBL2 = _interopRequireDefault(_PersonBL);

var _HandUtil = require('./HandUtil');

var _HandUtil2 = _interopRequireDefault(_HandUtil);

var _PlayerUtil = require('./PlayerUtil');

var _PlayerUtil2 = _interopRequireDefault(_PlayerUtil);

var _ScoreUtil = require('./ScoreUtil');

var _ScoreUtil2 = _interopRequireDefault(_ScoreUtil);

var _UpdateUtil = require('./UpdateUtil');

var _UpdateUtil2 = _interopRequireDefault(_UpdateUtil);

var _SerializeUtil = require('./SerializeUtil');

var _SerializeUtil2 = _interopRequireDefault(_SerializeUtil);

var _Base2 = require('../Base');

var _Base3 = _interopRequireDefault(_Base2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GAME = new WeakMap();

var Game = (function (_Base) {
    _inherits(Game, _Base);

    function Game(game) {
        _classCallCheck(this, Game);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Game).call(this));

        var player1 = new _PlayerBL2.default('North', game.turn === 0, game.nsTeam[0].players[0]);
        var player2 = new _PlayerBL2.default('East', game.turn === 1, game.ewTeam[0].players[0]);
        var player3 = new _PlayerBL2.default('South', game.turn === 2, game.nsTeam[0].players[1]);
        var player4 = new _PlayerBL2.default('West', game.turn === 3, game.ewTeam[0].players[1]);
        var gameData = {
            game: game,
            nsTeam: new _TeamBL2.default(game.nsTeam[0]),
            ewTeam: new _TeamBL2.default(game.ewTeam[0]),
            players: [player1, player2, player3, player4],
            people: [false, false, false, false],
            personCtr: 0
        };
        GAME.set(_this, gameData);

        gameData.players.forEach(function (player, index) {
            if (player.personId) {
                gameData.personCtr++;
                _PersonBL2.default.loadPerson(player.personId).then(function (person) {
                    gameData.people[index] = person;
                    gameData.personCtr--;
                });
            }
        });
        return _this;
    }

    _createClass(Game, [{
        key: 'finishLoading',
        value: function finishLoading() {
            var _resolve = null;
            var gameData = GAME.get(this);
            var loadingCheck = function loadingCheck() {
                if (gameData.personCtr > 0) {
                    return setTimeout(loadingCheck, 100);
                }

                _resolve();
            };

            return new Promise(function (resolve) {
                _resolve = resolve;
                setTimeout(loadingCheck, 0);
            });
        }
    }, {
        key: 'player',
        value: function player(direction) {
            switch (direction) {
                case 'North':
                    return GAME.get(this).players[0];
                case 'South':
                    return GAME.get(this).players[2];
                case 'East':
                    return GAME.get(this).players[1];
                case 'West':
                    return GAME.get(this).players[3];
                default:
                    return null;
            }
        }
    }, {
        key: 'person',
        value: function person(direction) {
            switch (direction) {
                case 'North':
                    return GAME.get(this).people[0];
                case 'South':
                    return GAME.get(this).people[2];
                case 'East':
                    return GAME.get(this).people[1];
                case 'West':
                    return GAME.get(this).people[3];
                default:
                    return null;
            }
        }
    }, {
        key: 'pile',
        value: function pile(direction) {
            var pileNo;
            switch (direction) {
                case 'North':
                    pileNo = 0;
                    break;
                case 'South':
                    pileNo = 2;
                    break;
                case 'East':
                    pileNo = 1;
                    break;
                case 'West':
                    pileNo = 3;
                    break;
                case 'Discard':
                    pileNo = 4;
                    break;
                default:
                    return null;
            }
            return GAME.get(this).game.piles[pileNo];
        }
    }, {
        key: 'team',
        value: function team(direction) {
            switch (direction) {
                case 'North':
                case 'South':
                    return GAME.get(this).nsTeam;
                case 'East':
                case 'West':
                    return GAME.get(this).ewTeam;
                default:
                    return null;
            }
        }

        // save this game to the DB

    }, {
        key: 'save',
        value: function save() {
            var _this2 = this;

            var DbGame = _mongoose2.default.model('Game');
            var game = GAME.get(this).game;
            return new Promise(function (resolve, reject) {
                DbGame.findById(game.id, function (err, checkGame) {
                    if (err) {
                        _this2.logger.fatal('Error getting check game');
                        _this2.logger.fatal(err.stack);
                        return reject(err);
                    }
                    if (checkGame && checkGame.__v !== game.__v) {
                        _this2.logger.warn('Game has been updated in DB since this row was retrieved');
                        return reject(new Error('Concurrency confict'));
                    }
                    game.save(function (err, savedGame) {
                        if (err) {
                            _this2.logger.fatal('error saving game');
                            _this2.logger.fatal(err.stack);
                            return reject(err);
                        }

                        GAME.get(_this2).game = savedGame;
                        resolve(_this2);
                    });
                });
            });
        }

        // the following methods use the hand utilities

    }, {
        key: 'dealNewHand',
        value: function dealNewHand() {
            _HandUtil2.default.dealNewHand(GAME.get(this));
        }
    }, {
        key: 'startNewHand',
        value: function startNewHand() {
            _HandUtil2.default.startNewHand(GAME.get(this));
        }

        // end the hand

    }, {
        key: 'endTheHand',
        value: function endTheHand() {
            _HandUtil2.default.endTheHand(GAME.get(this));

            // increment the round and end the game if the final round has been played
            if (game.round > 6) {
                this.endTheGame();
            }
        }

        // the follwing methods use the player utilites

    }, {
        key: 'addPlayer',
        value: function addPlayer(personId, direction) {
            var _this3 = this;

            return new Promise((function (resolve, reject) {
                _PlayerUtil2.default.addPlayer(GAME.get(_this3), personId, direction).then(function () {
                    return _this3.save();
                }).then(function (game) {
                    return resolve(game);
                }).catch(function (err) {
                    _this3.logger.fatal('add player');
                    _this3.logger.fatal(err.stack);
                    reject(err);
                });
            }).bind(this));
        }

        // end the game

    }, {
        key: 'endTheGame',
        value: function endTheGame() {
            GAME.get(this).game.gameComplete = true;
        }

        // the following methods use the score utilities
        // build the stats

    }, {
        key: 'buildStats',
        value: function buildStats(direction, youResigned, theyResigned) {
            return _ScoreUtil2.default.buildStats(GAME.get(this), direction, youResigned, theyResigned);
        }

        // score the game

    }, {
        key: 'score',
        value: function score(winningTeam) {
            return _ScoreUtil2.default.score(GAME.get(this), winningTeam);
        }

        // the following methods use the serialize utilites
        // deserialize into GameVM

    }, {
        key: 'deserialize',
        value: function deserialize() {
            return _SerializeUtil2.default.deserialize(GAME.get(this));
        }

        // the following methods use the update utilities

    }, {
        key: 'updateGame',
        value: function updateGame(playerVM, meldsVM, action, control) {
            var _this4 = this;

            var results = undefined;
            return new Promise((function (resolve, reject) {
                results = _UpdateUtil2.default.updateGame(GAME.get(_this4), playerVM, meldsVM, action, control);

                _this4.save().then(function (game) {
                    results.game = game;
                    resolve(results);
                }).catch(function (err) {
                    _this4.logger.fatal('save game');
                    _this4.logger.fatal(err.stack);
                    reject(err);
                });
            }).bind(this));
        }
    }, {
        key: 'id',
        get: function get() {
            return GAME.get(this).game._id;
        }
    }, {
        key: 'name',
        get: function get() {
            return GAME.get(this).game.name;
        }
    }, {
        key: 'gameComplete',
        get: function get() {
            return GAME.get(this).game.gameComplete;
        }
    }]);

    return Game;
})(_Base3.default);

// make this public and keep the rest private

function createGameClass(game) {
    return new Game(game);
}