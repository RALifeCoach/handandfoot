'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _Base2 = require('../classes/Base');

var _Base3 = _interopRequireDefault(_Base2);

var _Root = require('./peopleRoutes/Root');

var _Root2 = _interopRequireDefault(_Root);

var _Login = require('./peopleRoutes/Login');

var _Login2 = _interopRequireDefault(_Login);

var _Register = require('./peopleRoutes/Register');

var _Register2 = _interopRequireDefault(_Register);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var People = (function (_Base) {
    _inherits(People, _Base);

    function People() {
        var _ret;

        _classCallCheck(this, People);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(People).call(this));

        var router = _express2.default.Router();
        _this.routes = [];

        _this.routes.push(new _Root2.default(router));
        _this.routes.push(new _Login2.default(router));
        _this.routes.push(new _Register2.default(router));

        return _ret = router, _possibleConstructorReturn(_this, _ret);
    }

    return People;
})(_Base3.default);

exports.default = People;