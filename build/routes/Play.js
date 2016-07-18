'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _GameVM = require('../viewmodels/GameVM');

var _GameVM2 = _interopRequireDefault(_GameVM);

var _SendChat = require('./socket/SendChat');

var _SendChat2 = _interopRequireDefault(_SendChat);

var _GameMessage = require('./socket/GameMessage');

var _GameMessage2 = _interopRequireDefault(_GameMessage);

var _JoinGame = require('./socket/JoinGame');

var _JoinGame2 = _interopRequireDefault(_JoinGame);

var _LeaveGame = require('./socket/LeaveGame');

var _LeaveGame2 = _interopRequireDefault(_LeaveGame);

var _ResignRequest = require('./socket/ResignRequest');

var _ResignRequest2 = _interopRequireDefault(_ResignRequest);

var _ResignResponse = require('./socket/ResignResponse');

var _ResignResponse2 = _interopRequireDefault(_ResignResponse);

var _EndHandQuestion = require('./socket/EndHandQuestion');

var _EndHandQuestion2 = _interopRequireDefault(_EndHandQuestion);

var _EndHandResponse = require('./socket/EndHandResponse');

var _EndHandResponse2 = _interopRequireDefault(_EndHandResponse);

var _UpdateGame = require('./socket/UpdateGame');

var _UpdateGame2 = _interopRequireDefault(_UpdateGame);

var _Disconnect = require('./socket/Disconnect');

var _Disconnect2 = _interopRequireDefault(_Disconnect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Play = function Play(io, playGame) {
    var _this = this;

    _classCallCheck(this, Play);

    var mapper = new _GameVM2.default();
    this.handlers = [];
    io.on('connection', (function (socket) {
        // message handler for the chat message
        _this.handlers.push(new _SendChat2.default(socket, playGame));

        // message handler for messages from the game
        _this.handlers.push(new _GameMessage2.default(socket, playGame));

        // message handler for join game message
        _this.handlers.push(new _JoinGame2.default(socket, playGame, mapper));

        // message handler for the leave game message
        _this.handlers.push(new _LeaveGame2.default(socket, playGame, mapper));

        // message handler for the leave game message
        _this.handlers.push(new _ResignRequest2.default(socket, playGame));

        // message handler for the leave game message
        _this.handlers.push(new _ResignResponse2.default(socket, playGame, mapper));

        // message handler for the end hand question
        _this.handlers.push(new _EndHandQuestion2.default(socket, playGame));

        // message handler for the end hand question
        _this.handlers.push(new _EndHandResponse2.default(socket, playGame, mapper));

        // message handler for update cards message
        _this.handlers.push(new _UpdateGame2.default(socket, playGame, mapper));

        // message handler for disconnect
        _this.handlers.push(new _Disconnect2.default(socket, playGame, mapper));
    }).bind(this));
};

exports.default = Play;