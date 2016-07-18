'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BasePostRouter2 = require('../BasePostRouter');

var _BasePostRouter3 = _interopRequireDefault(_BasePostRouter2);

var _PersonVM = require('../../viewmodels/PersonVM');

var _PersonVM2 = _interopRequireDefault(_PersonVM);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Login = (function (_BasePostRouter) {
    _inherits(Login, _BasePostRouter);

    function Login(router) {
        _classCallCheck(this, Login);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Login).call(this, router, 'login'));
    }

    _createClass(Login, [{
        key: 'route',
        value: function route(req, res, next) {
            _get(Object.getPrototypeOf(Login.prototype), 'route', this).call(this);

            var Person = _mongoose2.default.model('Person');

            var userId = req.body.userId.toLowerCase();
            var query = Person.findOne({ userId: userId });
            query.exec((function (err, person) {
                if (err) {
                    return next(err);
                }
                if (!person) {
                    this.logger.warn('user not found');
                    this.logger.warn(req.body);
                    res.json({ error: true });
                    return;
                }

                if (person.password !== req.body.password) {
                    this.logger.warn('password does not match');
                    this.logger.warn(req.body);
                    this.logger.warn(person);
                    res.json({ error: true });
                    return;
                }

                res.json({
                    error: false,
                    person: _PersonVM2.default.mapToVM(person)
                });
            }).bind(this));
        }
    }]);

    return Login;
})(_BasePostRouter3.default);

exports.default = Login;