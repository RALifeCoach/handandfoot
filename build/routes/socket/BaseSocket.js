'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseSocket = (function () {
    function BaseSocket(socket, playGame, messageName) {
        _classCallCheck(this, BaseSocket);

        this.playGame = playGame;
        this.messageName = messageName;
        this.socket = socket;
        this.logger = _bunyan2.default.createLogger({
            name: 'SocketMessage ' + messageName
        });
        socket.on(messageName, this.onSocketMessage.bind(this));
    }

    _createClass(BaseSocket, [{
        key: 'sendMessage',
        value: function sendMessage(connection, messageName, body) {
            this.logger.info('send ' + messageName);
            connection.socket.emit(messageName, body);
        }
    }, {
        key: 'emitMessage',
        value: function emitMessage(messageName, body) {
            this.logger.info('emit ' + messageName);
            this.socket.server.sockets.emit(messageName, body);
        }
    }, {
        key: 'onSocketMessage',
        value: function onSocketMessage() {
            this.logger.info('received ' + this.messageName);
        }
    }]);

    return BaseSocket;
})();

exports.default = BaseSocket;