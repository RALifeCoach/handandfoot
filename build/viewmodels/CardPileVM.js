'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _CardVM = require('./CardVM');

var _CardVM2 = _interopRequireDefault(_CardVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CardPileVM = (function () {
    function CardPileVM(inPile) {
        _classCallCheck(this, CardPileVM);

        this.cardPile = [];

        if (inPile) {
            this.cardPile = inPile.map(function (card) {
                return new _CardVM2.default(card);
            });
        }
    }

    _createClass(CardPileVM, [{
        key: 'deserialize',
        value: function deserialize() {
            return this.cardPile.map(function (card) {
                return card.deserialize();
            });
        }
    }, {
        key: 'serialize',
        value: function serialize() {
            return this.cardPile.map(function (card) {
                return card.serialize();
            });
        }
    }, {
        key: 'cards',
        get: function get() {
            return this.cardPile;
        }
    }]);

    return CardPileVM;
})();

exports.default = CardPileVM;