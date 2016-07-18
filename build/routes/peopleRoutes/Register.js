'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BasePostRouter = require('../BasePostRouter');

var _BasePostRouter2 = _interopRequireDefault(_BasePostRouter);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _PersonVM = require('../../viewmodels/PersonVM');

var _PersonVM2 = _interopRequireDefault(_PersonVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Register = (function (_BaseRouter) {
    _inherits(Register, _BaseRouter);

    function Register(router) {
        _classCallCheck(this, Register);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Register).call(this, router, 'register'));
    }

    _createClass(Register, [{
        key: 'route',
        value: function route(req, res, next) {
            _get(Object.getPrototypeOf(Register.prototype), 'route', this).call(this);

            var Person = _mongoose2.default.model('Person');

            var query = Person.findOne({ userId: req.body.userId });

            if (req.body.password !== req.body.confirmPassword) {
                res.json({ error: 'password and confirm password do not agree' });
                return;
            }

            if (req.body.password.length < 2) {
                res.json({ error: 'password must be at least 6 characters long' });
                return;
            }

            query.exec(function (err, person) {
                if (err) {
                    return next(err);
                }
                if (person) {
                    res.json({ error: 'user id already exists' });
                    return;
                }

                person = new Person(req.body);
                person.userId = person.userId.toLowerCase();
                person.save();
                res.json({ error: false, person: _PersonVM2.default.mapToVM(person) });
            });
        }
    }]);

    return Register;
})(_BasePostRouter2.default);

exports.default = Register;