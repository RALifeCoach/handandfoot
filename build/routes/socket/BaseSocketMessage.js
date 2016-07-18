'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BaseSocket2 = require('./BaseSocket');

var _BaseSocket3 = _interopRequireDefault(_BaseSocket2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaseSocketMessage = (function (_BaseSocket) {
    _inherits(BaseSocketMessage, _BaseSocket);

    function BaseSocketMessage(socket, playGame, messageName) {
        _classCallCheck(this, BaseSocketMessage);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(BaseSocketMessage).call(this, socket, playGame, messageName));
    }

    _createClass(BaseSocketMessage, [{
        key: 'sendMessageToAll',
        value: function sendMessageToAll(data) {
            var _this2 = this;

            this.logger.log('send to all ' + messageName);

            this.connectedGame.sockets.forEach(function (connection) {
                _this2.sendMessage(connection, 'chatUpdate', data);
            });
        }
    }, {
        key: 'onSocketMessage',
        value: function onSocketMessage() {
            _get(Object.getPrototypeOf(BaseSocketMessage.prototype), 'onSocketMessage', this).call(this);

            this.connectedPlayer = playGame.findConnectedPlayer(this.socket);
            if (!this.connectedPlayer) {
                return false;
            }

            this.connectedGame = playGame.findConnectedGame(this.socket, this.connectedPlayer.gameId);
            return !this.connectedGame;
        }
    }]);

    return BaseSocketMessage;
})(_BaseSocket3.default);

exports.default = BaseSocketMessage;