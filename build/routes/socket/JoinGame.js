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

var JoinGame = (function (_BaseSocket) {
    _inherits(JoinGame, _BaseSocket);

    function JoinGame(socket, playGame) {
        _classCallCheck(this, JoinGame);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(JoinGame).call(this, socket, playGame, 'joinGame'));
    }

    _createClass(JoinGame, [{
        key: 'onSocketMessage',
        value: function onSocketMessage(data) {
            var _this2 = this;

            _get(Object.getPrototypeOf(JoinGame.prototype), 'onSocketMessage', this).call(this);

            if (!this.playGame.newConnectedPlayer(this.socket, data)) {
                return;
            }

            // add the player to the game and game VM
            _GameVM2.default.addPlayer(data.gameId, data.personId, data.direction).then(function (game) {
                var connectedGame = _this2.playGame.findCreateConnectedGame(_this2.socket, data);
                if (!connectedGame) {
                    return;
                }

                _this2.emitMessage('refreshGames');

                // send the message
                connectedGame.sendMessages(game, _this2.socket);
            }).catch(function (err) {
                _this2.logger.fatal('mapper add player');
                _this2.logger.fatal(err.stack);
                _this2.logger.fatal(data.gameId);
                throw err;
            });
        }
    }]);

    return JoinGame;
})(_BaseSocket3.default);

exports.default = JoinGame;