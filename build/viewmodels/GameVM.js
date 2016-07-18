'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _PlayerVM = require('./PlayerVM');

var _PlayerVM2 = _interopRequireDefault(_PlayerVM);

var _MeldsVM = require('./MeldsVM');

var _MeldsVM2 = _interopRequireDefault(_MeldsVM);

var _GameUtil = require('../classes/game/GameUtil');

var _GameUtil2 = _interopRequireDefault(_GameUtil);

var _Base2 = require('../classes/Base');

var _Base3 = _interopRequireDefault(_Base2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GameVM = (function (_Base) {
    _inherits(GameVM, _Base);

    function GameVM() {
        _classCallCheck(this, GameVM);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(GameVM).apply(this, arguments));
    }

    _createClass(GameVM, null, [{
        key: 'scoreTheGame',
        value: function scoreTheGame(game, winningTeam) {
            return game.score(winningTeam);
        }
    }, {
        key: 'addStats',
        value: function addStats(game, direction, youResigned, theyResigned) {
            var _this2 = this;

            var results = game.buildStats(direction, youResigned, theyResigned);
            // update the person document

            var person = game.person(direction);
            person.stats.push(results.stat);

            return new Promise(function (resolve, reject) {
                person.save().then(function () {
                    return resolve(_this2);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        // update players - record scores

    }, {
        key: 'updatePlayers',
        value: function updatePlayers(game, personId) {
            var nsResigned = false;
            var ewResigned = false;
            if (personId) {
                if (personId.toString() === game.players('North').personId.toString() || personId.toString() === game.players('South').personId.toString()) nsResigned = true;else ewResigned = true;
            }

            return new Promise(function (resolve, reject) {
                var results = undefined;
                results = game.buildStats('North', nsResigned, ewResigned);
                game.person('North').addStats(results.stat).then(function () {
                    results = game.buildStats('South', nsResigned, ewResigned);
                    return game.person('South').addStats(results.stat);
                }).then(function () {
                    results = game.buildStats('East', ewResigned, nsResigned);
                    return game.person('East').addStats(results.stat);
                }).then(function () {
                    results = game.buildStats('West', ewResigned, nsResigned);
                    return game.person('West').addStats(results.stat);
                }).then(function () {
                    return resolve();
                }).catch(function (err) {
                    GameVM.loggerWarn(err.stack);
                    reject(err);
                });
            });
        }
    }, {
        key: 'getAllIncompleteGames',
        value: function getAllIncompleteGames(personId) {
            return new Promise(function (resolve, reject) {
                _GameUtil2.default.findIncompleteGames().then(function (games) {
                    var gamesVM = [];
                    var ctr = games.length;
                    games.forEach(function (game) {
                        game.finishLoading().then(function () {
                            var gameVM = game.deserialize();

                            gameVM.playerAttached = false;
                            gameVM.players.forEach(function (player) {
                                if (player.person && player.person.id.toString() === personId.toString()) {
                                    gameVM.playerAttached = true;
                                }
                            });

                            // add game if it is still awaiting players
                            if (!gameVM.playersFull || gameVM.playerAttached) gamesVM.push(gameVM);

                            // when all games have been mapped to gameVM return the message to the front end
                            if (--ctr === 0) {
                                resolve(gamesVM);
                            }
                        });
                    });
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }
    }, {
        key: 'addPlayer',
        value: function addPlayer(gameId, personId, direction) {
            return new Promise(function (resolve, reject) {
                _GameUtil2.default.loadGame(gameId).then(function (game) {
                    return game.addPlayer(personId, direction);
                }).then(function (game) {
                    resolve(game);
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }

        // no promise required as it does not return a message

    }, {
        key: 'removePlayer',
        value: function removePlayer(gameId, personId) {
            var _this3 = this;

            return new Promise(function (resolve) {
                _GameUtil2.default.loadGame(gameId).then(function (game) {
                    // create the existing player
                    var player = GameVM.getPlayer(game);

                    if (!player) {
                        GameVM.loggerWarn(_this3, 'player not found in game');
                        GameVM.loggerWarn(_this3, personId);
                        GameVM.loggerWarn(_this3, game.nsTeam[0].players);
                        GameVM.loggerWarn(_this3, game.ewTeam[0].players);
                    }

                    player.connected = false;

                    // save the game
                    return game.save();
                }).then(function (game) {
                    resolve(game.deserialize());
                }).catch(function (err) {
                    GameVM.loggerWarn(_this3, err.stack);
                });
            });
        }
    }, {
        key: 'getPlayer',
        value: function getPlayer(game) {
            var player = null;
            if (game.player('North') && game.player('North').personId.toString() === personId.toString()) {
                player = game.player('North');
            } else if (game.player('South') && game.player('South').personId.toString() === personId.toString()) {
                player = game.player('South');
            } else if (game.player('East') && game.player('East').personId.toString() === personId.toString()) {
                player = game.player('East');
            } else if (game.player('West') && game.player('West').personId.toString() === personId.toString()) {
                player = game.player('West');
            }
            return player;
        }

        // update cards from message from a game

    }, {
        key: 'updateGame',
        value: function updateGame(gameId, playerVM, meldsVM, action, control) {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                // find game from DB
                var playerVMClass = new _PlayerVM2.default();
                playerVMClass.loadPlayer(playerVM);
                var meldsVMClass = new _MeldsVM2.default(meldsVM);
                _GameUtil2.default.loadGame(gameId).then(function (game) {
                    return game.updateGame(playerVMClass, meldsVMClass, action, control);
                }).then(function (results) {
                    var game = results.game;
                    // if the game is complete, update the stats
                    if (game.gameComplete) {
                        GameVM.updatePlayers(game, false).then(function () {
                            resolve(results);
                        });
                    } else {
                        resolve(results);
                    }
                }).catch(function (err) {
                    GameVM.loggerWarn(_this4, err.stack);
                    reject(err);
                });
            });
        }
    }, {
        key: 'endGame',

        // end the game
        value: function endGame(gameId, personId, callback) {
            var _this5 = this;

            // find game from DB
            _GameUtil2.default.loadGame(gameId).then(function (game) {
                GameVM.scoreTheGame(game, null);
                _this5.endTheGame(game);

                // save the game
                game.save(function (err) {
                    if (err) {
                        GameVM.loggerWarn(_this5, 'error saving game');
                        GameVM.loggerWarn(_this5, err.stack);
                        GameVM.loggerWarn(_this5, game);
                        return callback(err);
                    }

                    GameVM.updatePlayers(game, personId);
                });
            }).catch(function (err) {
                return callback(err);
            });
        }
    }]);

    return GameVM;
})(_Base3.default);

exports.default = GameVM;