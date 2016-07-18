'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _ConnectedGame = require('./ConnectedGame');

var _ConnectedGame2 = _interopRequireDefault(_ConnectedGame);

var _Base2 = require('./Base');

var _Base3 = _interopRequireDefault(_Base2);

var _GameVM = require('../viewmodels/GameVM');

var _GameVM2 = _interopRequireDefault(_GameVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlayGame = (function (_Base) {
    _inherits(PlayGame, _Base);

    function PlayGame() {
        _classCallCheck(this, PlayGame);

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(PlayGame).call(this));

        _this2.connectedPlayers = [];
        _this2.connectedGames = [];
        return _this2;
    }

    _createClass(PlayGame, [{
        key: 'leaveGame',
        value: function leaveGame(socket) {
            var _this3 = this;

            // common routine for leaving the game
            // check to see if the player is playing a game
            var connectedPlayer = this.findConnectedPlayer(socket);
            if (!connectedPlayer) return;

            // add the player and socket to the game VM
            _GameVM2.default.removePlayer(connectedPlayer.gameId, connectedPlayer.personId, (function (err, gameVM) {
                if (err) {
                    _this3.logger.warn(err.stack);
                    return;
                }

                _this3.onRemovePlayerComplete(gameVM, socket, connectedPlayer);
            }).bind(this));
        }
    }, {
        key: 'onRemovePlayerComplete',
        value: function onRemovePlayerComplete(gameVM, socket, connectedPlayer) {
            // find the game, error if it doesn't exist
            var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
            if (!connectedGame) return;

            // remove player from connected players
            var playerIndex = _this.connectedPlayers.indexOf(connectedPlayer);
            this.connectedPlayers.splice(playerIndex, 1);

            // if it's the last player then remove the game
            if (connectedGame.sockets.length === 1) {
                var gameIndex = _this.connectedGames.indexOf(connectedGame);
                this.connectedGames.splice(gameIndex, 1);
            } else {
                // remove the socket
                for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
                    if (connectedGame.sockets[socketIndex] === socket.id) {
                        connectedGame.sockets.splice(socketIndex, 1);
                        break;
                    }
                }

                // send the message to the remaining players
                connectedGame.sendMessages(gameVM, socket);
            }
        }
    }, {
        key: 'newConnectedPlayer',
        value: function newConnectedPlayer(socket, data) {
            // check to see if the player is already playing a game
            for (var playerIndex = 0; playerIndex < this.connectedPlayers.length; playerIndex++) {
                if (this.connectedPlayers[playerIndex].personId.toString() === data.personId.toString()) {
                    this.logger.warn(this.connectedPlayers[playerIndex]);
                    this.logger.warn('player already playing');

                    this.connectedPlayers.splice(playerIndex, 1);
                    break;
                }
            }

            // add the new player to the list of players
            this.connectedPlayers.push({
                personId: data.personId,
                direction: data.direction,
                personName: data.name,
                socketId: socket.id,
                gameId: data.gameId
            });
            return true;
        }
    }, {
        key: 'findCreateConnectedGame',
        value: function findCreateConnectedGame(socket, data) {
            // find the game, create if it doesn't exist
            var connectedGame = false;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.connectedGames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var game = _step.value;

                    if (game.gameId.toString() === data.gameId.toString()) {
                        connectedGame = game;
                        break;
                    }
                }

                // in no connected game found then create one
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (!connectedGame) {
                connectedGame = new _ConnectedGame2.default(data.gameId);
                this.connectedGames.push(connectedGame);
            } else {
                // in case the socket already exists for this direction - remove it
                for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
                    if (connectedGame.sockets[socketIndex].direction === data.direction) {
                        connectedGame.sockets.splice(socketIndex, 1);
                        break;
                    }
                }
            }

            // add the socket to the game - for sending
            connectedGame.sockets.push({ direction: data.direction, socket: socket });

            return connectedGame;
        }
    }, {
        key: 'findConnectedPlayer',
        value: function findConnectedPlayer(socket) {
            // check to see if the player is playing a game
            var connectedPlayer = false;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.connectedPlayers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var player = _step2.value;

                    if (player.socketId.toString() === socket.id.toString()) {
                        connectedPlayer = player;
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            if (!connectedPlayer) {
                this.logger.warn('player not playing');
                return false;
            }

            return connectedPlayer;
        }
    }, {
        key: 'findConnectedGame',
        value: function findConnectedGame(socket, gameId) {
            // find the game, error if it doesn't exist
            var connectedGame = false;
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.connectedGames[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var game = _step3.value;

                    if (game.gameId.toString() === gameId.toString()) {
                        connectedGame = game;
                        break;
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            if (!connectedGame) {
                this.logger.warn('game not found');
                socket.emit('error', { error: 'Game not found' });
                return;
            }

            return connectedGame;
        }
    }, {
        key: 'sendEndHandQuestion',

        // received end hand question - send it to all players
        value: function sendEndHandQuestion(socket) {
            // check to see if the player is playing a game
            var connectedPlayer = this.findConnectedPlayer(socket);
            if (!connectedPlayer) return;

            // find the game, error if it doesn't exist
            var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
            if (!connectedGame) return;

            // send to each player
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = connectedGame.sockets[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var socketVM = _step4.value;

                    socketVM.socket.emit('endHandQuestion', {
                        direction: connectedPlayer.direction,
                        personName: connectedPlayer.personName
                    });
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }, {
        key: 'sendEndHandResponse',

        // received end hand question - send it to all players
        value: function sendEndHandResponse(socket, data) {
            // check to see if the player is playing a game
            var connectedPlayer = this.findConnectedPlayer(socket);
            if (!connectedPlayer) return;

            // find the game, error if it doesn't exist
            var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
            if (!connectedGame) return;

            // send to each player
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = connectedGame.sockets[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var socketVM = _step5.value;

                    socketVM.socket.emit('endHandResponse', data);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        }
    }, {
        key: 'sendResignRequest',

        // received a request to resign - send it to all players
        value: function sendResignRequest(socket) {
            // check to see if the player is playing a game
            var connectedPlayer = this.findConnectedPlayer(socket);
            if (!connectedPlayer) return;

            // find the game, error if it doesn't exist
            var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
            if (!connectedGame) return;

            // send to each player
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
                for (var _iterator6 = connectedGame.sockets[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                    var socketVM = _step6.value;

                    socketVM.socket.emit('resignRequest', {
                        direction: connectedPlayer.direction,
                        personName: connectedPlayer.personName
                    });
                }
            } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion6 && _iterator6.return) {
                        _iterator6.return();
                    }
                } finally {
                    if (_didIteratorError6) {
                        throw _iteratorError6;
                    }
                }
            }
        }
    }, {
        key: 'endTheGame',
        value: function endTheGame(socket, wasResigned) {
            var _this4 = this;

            // find the player, error if not found
            var connectedPlayer = this.findConnectedPlayer(socket);
            if (!connectedPlayer) return;

            var personId = wasResigned ? connectedPlayer.personId : false;
            _GameVM2.default.endGame(connectedPlayer.gameId, personId, (function (err, game) {
                if (err) {
                    return;
                }

                _this4.onEndGameComplete(game, socket, wasResigned, connectedPlayer);
            }).bind(this));
        }
    }, {
        key: 'onEndGameComplete',
        value: function onEndGameComplete(game, socket, wasResigned, connectedPlayer) {
            // find the game, error if it doesn't exist
            var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
            if (!connectedGame) return;

            // send the resign response
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = connectedGame[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var socketVM = _step7.value;

                    var sendSocket = socketVM.socket;
                    var results = PlayGame.getResults(direction, wasResigned, connectedPlayer, game);

                    // send the resign response to each player
                    sendSocket.emit('resignResponse', {
                        result: results
                    });
                }
            } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                    }
                } finally {
                    if (_didIteratorError7) {
                        throw _iteratorError7;
                    }
                }
            }
        }
    }, {
        key: 'sendResignNoResponse',
        value: function sendResignNoResponse(socket) {
            // find the player, error if not found
            var connectedPlayer = this.findConnectedPlayer(socket);
            if (!connectedPlayer) return;

            // find the game, error if it doesn't exist
            var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
            if (!connectedGame) return;

            // send the resign response
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = connectedGame.sockets[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var socketVM = _step8.value;

                    socketVM.socket.emit('resignResponse', { result: 'no' });
                }
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }
        }
    }], [{
        key: 'getResults',
        value: function getResults(direction, wasResigned, connectedPlayer, game) {
            switch (direction) {
                case 'North':
                case 'South':
                    return PlayGame.getResultsDirection(wasResigned, connectedPlayer, ['East', 'West'], [game.nsTeam[0].score, game.ewTeam[0].score]);
                case 'East':
                case 'West':
                    return PlayGame.getResultsDirection(wasResigned, connectedPlayer, ['North', 'South'], [game.ewTeam[0].score, game.nsTeam[0].score]);
                default:
                    throw new Error('unknown direction ' + direction);
            }
        }
    }, {
        key: 'getResultsDirection',
        value: function getResultsDirection(wasResigned, connectedPlayer, directions, scores) {
            if (wasResigned && (connectedPlayer.direction === directions[0] || connectedPlayer.direction === directions[1])) {
                return 'winner';
            }
            if (scores[0] > scores[1]) {
                return 'winner';
            }

            return 'loser';
        }
    }]);

    return PlayGame;
})(_Base3.default);

exports.default = PlayGame;