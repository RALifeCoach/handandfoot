'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _Game = require('./Game');

var gameClass = _interopRequireWildcard(_Game);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ObjectId = _mongoose2.default.Types.ObjectId;

var GameUtil = (function () {
    function GameUtil() {
        _classCallCheck(this, GameUtil);
    }

    _createClass(GameUtil, null, [{
        key: 'loadGame',
        value: function loadGame(gameId) {
            var DbGame = _mongoose2.default.model('Game');
            return new Promise(function (resolve, reject) {
                var query1 = DbGame.findById(gameId);
                query1.exec(function (err, game) {
                    if (err) {
                        console.log(err.stack);
                        console.log(gameId);
                        return reject(err);
                    }
                    if (!game) {
                        console.log("can't find game");
                        console.log(gameId);
                        return reject(new Error("can't find game"));
                    }
                    var newGame = gameClass.createGameClass(game);
                    newGame.finishLoading().then(function () {
                        return resolve(newGame);
                    });
                });
            });
        }
    }, {
        key: 'createGame',
        value: function createGame() {
            var DbGame = _mongoose2.default.model('Game');
            var game;
            switch (arguments.length) {
                case 1:
                    // the mongoose game class
                    game = arguments[0];
                    break;
                case 2:
                    // create a new game passing in name and password
                    var name = arguments[0];
                    var password = arguments[1];
                    game = new DbGame({ name: name, password: password });
                    var player = { person: [], direction: '', handCards: [], footCards: [] };
                    var team = { score: 0, players: [player, player] };

                    game.nsTeam.push(team);
                    game.ewTeam.push(team);
                    game.piles = [{ direction: 'North', cards: [] }, { direction: 'East', cards: [] }, { direction: 'South', cards: [] }, { direction: 'West', cards: [] }, { direction: 'Discard', cards: [] }];
                    break;
                default:
                    throw new Error('constructor invalid number of arguments');
            }
            var newGameBL = gameClass.createGameClass(game);
            return new Promise(function (resolve) {
                newGameBL.finishLoading().then(function () {
                    return resolve(newGameBL);
                });
            });
        }
    }, {
        key: 'turnOffConnected',
        value: function turnOffConnected(personId) {
            var DbGame = _mongoose2.default.model('Game');
            // update DB to turn off connected flag for person
            return new Promise(function (resolve, reject) {
                var objPersonId = new ObjectId(personId);
                DbGame.find({ $or: [{ 'nsTeam.0.players.person.0': objPersonId }, { 'ewTeam.0.players.person.0': objPersonId }] }, function (err, games) {
                    if (err) {
                        console.log(err.stack);
                        return reject(err);
                    }

                    var ctr = games.length;
                    if (ctr === 0) {
                        return resolve();
                    }

                    games.forEach(function (game) {
                        if (game.nsTeam[0].players[0].person.length > 0 && game.nsTeam[0].players[0].person[0].toString() === personId) game.nsTeam[0].players[0].connected = false;else if (game.nsTeam[0].players[1].person.length > 0 && game.nsTeam[0].players[1].person[0].toString() === personId) game.nsTeam[0].players[1].connected = false;else if (game.ewTeam[0].players[0].person.length > 0 && game.ewTeam[0].players[0].person[0].toString() === personId) game.ewTeam[0].players[0].connected = false;else game.ewTeam[0].players[1].connected = false;
                        game.save(function (err) {
                            if (err) {
                                console.log(err.stack);
                                return reject(err);
                            }

                            if (--ctr === 0) resolve();
                        });
                    });
                });
            });
        }
    }, {
        key: 'findIncompleteGames',
        value: function findIncompleteGames() {
            var DbGame = _mongoose2.default.model('Game');
            return new Promise(function (resolve, reject) {
                DbGame.find().where({ gameComplete: false }).exec(function (err, games) {
                    if (err) {
                        console.log(err.stack);
                        return reject(err);
                    }

                    var results = [];
                    games.forEach(function (game) {
                        return results.push(gameClass.createGameClass(game));
                    });
                    resolve(results);
                });
            });
        }
    }]);

    return GameUtil;
})();

exports.default = GameUtil;