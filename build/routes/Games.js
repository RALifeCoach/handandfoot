'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _Base2 = require('../classes/Base');

var _Base3 = _interopRequireDefault(_Base2);

var _GetAll = require('./gamesRoutes/GetAll');

var _GetAll2 = _interopRequireDefault(_GetAll);

var _ShowScores = require('./gamesRoutes/ShowScores');

var _ShowScores2 = _interopRequireDefault(_ShowScores);

var _GetHints = require('./gamesRoutes/GetHints');

var _GetHints2 = _interopRequireDefault(_GetHints);

var _GetHelp = require('./gamesRoutes/GetHelp');

var _GetHelp2 = _interopRequireDefault(_GetHelp);

var _Root = require('./gamesRoutes/Root');

var _Root2 = _interopRequireDefault(_Root);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Games = (function (_Base) {
    _inherits(Games, _Base);

    function Games(io) {
        var _ret;

        _classCallCheck(this, Games);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Games).call(this));

        _this.routes = [];
        io.on('connection', (function () {
            _this.logger.info('game connection');
        }).bind(_this));

        var router = _express2.default.Router();

        _this.routes.push(new _GetAll2.default(router));
        _this.routes.push(new _ShowScores2.default(router));
        _this.routes.push(new _GetHints2.default(router));
        _this.routes.push(new _GetHelp2.default(router));
        _this.routes.push(new _Root2.default(router, io));

        return _ret = router, _possibleConstructorReturn(_this, _ret);
    }

    return Games;
})(_Base3.default);

exports.default = Games;