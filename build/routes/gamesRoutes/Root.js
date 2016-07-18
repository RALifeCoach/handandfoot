'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BasePostRouter = require('../BasePostRouter');

var _BasePostRouter2 = _interopRequireDefault(_BasePostRouter);

var _GameUtil = require('../../classes/game/GameUtil');

var _GameUtil2 = _interopRequireDefault(_GameUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Root = (function (_BaseRouter) {
    _inherits(Root, _BaseRouter);

    function Root(router, io) {
        _classCallCheck(this, Root);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Root).call(this, router, ''));

        _this.io = io;
        return _this;
    }

    _createClass(Root, [{
        key: 'route',
        value: function route(req, res, next) {
            var _this2 = this;

            _get(Object.getPrototypeOf(Root.prototype), 'route', this).call(this);

            _GameUtil2.default.createGame(req.body.game.name, req.body.game.password).then(function (game) {
                return game.save();
            }).then(function (game) {
                res.json(game.deserialize());

                // broadcast to all players
                _this2.io.sockets.emit('refreshGames');
            }).catch(function (err) {
                _this2.logger.fatal(err.stack);
                next(err);
            });
        }
    }]);

    return Root;
})(_BasePostRouter2.default);

exports.default = Root;