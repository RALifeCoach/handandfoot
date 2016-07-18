'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BasePostRouter = require('../BasePostRouter');

var _BasePostRouter2 = _interopRequireDefault(_BasePostRouter);

var _GameVM = require('../../viewmodels/GameVM');

var _GameVM2 = _interopRequireDefault(_GameVM);

var _GameUtil = require('../../classes/game/GameUtil');

var _GameUtil2 = _interopRequireDefault(_GameUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GetAll = (function (_BaseRouter) {
    _inherits(GetAll, _BaseRouter);

    function GetAll(router) {
        _classCallCheck(this, GetAll);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(GetAll).call(this, router, 'getAll'));
    }

    _createClass(GetAll, [{
        key: 'route',
        value: function route(req, res, next) {
            var _this2 = this;

            _get(Object.getPrototypeOf(GetAll.prototype), 'route', this).call(this);

            _GameUtil2.default.turnOffConnected(req.body.personId).then(function () {
                // find games that are not complete
                return _GameVM2.default.getAllIncompleteGames(req.body.personId);
            }).then(function (gamesVM) {
                res.json(gamesVM);
            }).catch(function (err) {
                _this2.logger.fatal(err);
                _this2.logger.fatal(err.stack);
                next(err);
            });
        }
    }]);

    return GetAll;
})(_BasePostRouter2.default);

exports.default = GetAll;