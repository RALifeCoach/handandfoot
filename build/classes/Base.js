'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Base = (function () {
    function Base() {
        _classCallCheck(this, Base);

        this.logger = _bunyan2.default.createLogger({
            name: this.constructor.name
        });
    }

    _createClass(Base, null, [{
        key: 'loggerInfo',
        value: function loggerInfo(message) {
            var logger = _bunyan2.default.createLogger({
                name: this.constructor.name
            });
            logger.info(message);
        }
    }, {
        key: 'loggerWarn',
        value: function loggerWarn(callingClass, message) {
            var logger = _bunyan2.default.createLogger({
                name: callingClass.constructor.name
            });
            logger.warn(message);
        }
    }]);

    return Base;
})();

exports.default = Base;