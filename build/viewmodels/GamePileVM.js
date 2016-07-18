'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _CardPileVM = require('./CardPileVM');

var _CardPileVM2 = _interopRequireDefault(_CardPileVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GamePileVM = (function () {
    function GamePileVM(direction, inPile) {
        _classCallCheck(this, GamePileVM);

        this.direction = direction;
        this.cardPile = new _CardPileVM2.default(inPile);
    }

    _createClass(GamePileVM, [{
        key: 'deserialize',
        value: function deserialize() {
            return {
                direction: direction,
                cards: this.cardPile.deserialize()
            };
        }
    }, {
        key: 'serialize',
        value: function serialize() {
            return {
                direction: direction,
                cards: this.cardPile.serialize()
            };
        }
    }, {
        key: 'cards',
        get: function get() {
            return this.cardPile.cards;
        }
    }]);

    return GamePileVM;
})();

exports.default = GamePileVM;