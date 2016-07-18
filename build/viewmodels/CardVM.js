'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
var suitsCard = ['clubs', 'diams', 'hearts', 'spades', 'joker'];

var CardVM = (function () {
    function CardVM(card) {
        _classCallCheck(this, CardVM);

        if (typeof card.cardNumber === 'undefined') {
            this.suit = card.suit;
            this.number = card.number;
        } else {
            this.suit = card.suitNumber;
            this.number = card.cardNumber;
        }
    }

    _createClass(CardVM, [{
        key: 'deserialize',
        value: function deserialize() {
            return {
                suitNumber: this.suit,
                cardNumber: this.number,
                suitCard: suitsCard[this.suit],
                number: this.number > -1 ? cards[this.number] : -1
            };
        }
    }, {
        key: 'serialize',
        value: function serialize() {
            return {
                suit: this.suit,
                number: this.number
            };
        }
    }]);

    return CardVM;
})();

exports.default = CardVM;