'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _Base2 = require('./Base');

var _Base3 = _interopRequireDefault(_Base2);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PersonBL = (function (_Base) {
    _inherits(PersonBL, _Base);

    function PersonBL() {
        _classCallCheck(this, PersonBL);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PersonBL).call(this));

        var DbPerson = _mongoose2.default.model('Person');

        if (arguments.length === 1) {
            // create from existing data
            _this.person = arguments[0];
        } else {
            // create new person
            _this.person = new DbPerson();
            _this.person.name = arguments[0];
            _this.person.userId = arguments[1];
            _this.person.password = arguments[2];
        }
        return _this;
    }

    _createClass(PersonBL, [{
        key: 'save',
        value: function save() {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                _this2.person.save(function (err, savedPerson) {
                    if (err) {
                        _this2.logger.warn(err.stack);
                        reject(err);
                    }

                    _this2.person = savedPerson;
                    resolve(_this2.person);
                });
            });
        }
    }, {
        key: 'addStats',
        value: function addStats(stat) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                _this3.person.stats.push(stat);
                _this3.save().then(function (savedPerson) {
                    resolve(savedPerson);
                }).catch(function (err) {
                    reject(err);
                });
            });
        }
    }, {
        key: 'id',
        get: function get() {
            return this.person._id;
        }
    }, {
        key: 'name',
        get: function get() {
            return this.person.name;
        }
    }], [{
        key: 'loadPerson',
        value: function loadPerson(personId) {
            var _this4 = this;

            var DbPerson = _mongoose2.default.model('Person');

            return new Promise(function (resolve, reject) {
                DbPerson.findById(personId, function (err, person) {
                    if (err) {
                        _this4.logger.warn(err.stack);
                        return reject(err);
                    }

                    if (!person) {
                        var except = new Error('Person not found by id');
                        _this4.logger.warn(personId);
                        _this4.logger.warn(except.stack);
                        return reject(except);
                    }

                    resolve(person);
                });
            });
        }
    }]);

    return PersonBL;
})(_Base3.default);

exports.default = PersonBL;