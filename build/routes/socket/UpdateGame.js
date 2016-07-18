'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BaseSocket2 = require('./BaseSocket');

var _BaseSocket3 = _interopRequireDefault(_BaseSocket2);

var _GameVM = require('../../viewmodels/GameVM');

var _GameVM2 = _interopRequireDefault(_GameVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UpdateGame = (function (_BaseSocket) {
    _inherits(UpdateGame, _BaseSocket);

    function UpdateGame(socket, playGame) {
        _classCallCheck(this, UpdateGame);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(UpdateGame).call(this, socket, playGame, 'updateGame'));
    }

    _createClass(UpdateGame, [{
        key: 'onSocketMessage',
        value: function onSocketMessage(data) {
            var _this2 = this;

            _get(Object.getPrototypeOf(UpdateGame.prototype), 'onSocketMessage', this).call(this);

            this.connectedPlayer = this.playGame.findConnectedPlayer(this.socket);
            if (!this.connectedPlayer) return;

            // update the game and, optionally, the game VM
            _GameVM2.default.updateGame(this.connectedPlayer.gameId, data.player, data.melds, data.action, data.control).then(this.onUpdateGameResults.bind(this)).catch(function (err) {
                _this2.logger.fatal('Update Game');
                _this2.logger.fatal(err.stack);
                _this2.logger.fatal(data.gameId);
                throw err;
            });
        }
    }, {
        key: 'onUpdateGameResults',
        value: function onUpdateGameResults(results) {
            if (!results.updatePlayers) {
                return;
            }

            // the game is over
            if (results.game.gameComplete) {
                this.playGame.endTheGame(this.socket, false);
            } else {
                // find the game, error if it doesn't exist
                var connectedGame = this.playGame.findConnectedGame(this.socket, this.connectedPlayer.gameId);
                if (!connectedGame) {
                    throw new Error('Cannot find connected game');
                }

                // send the updates to the other players
                connectedGame.sendMessages(results.game, this.socket, results.results);
            }
        }
    }]);

    return UpdateGame;
})(_BaseSocket3.default);

exports.default = UpdateGame;