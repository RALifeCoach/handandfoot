'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _CardPileVM = require('./CardPileVM');

var _CardPileVM2 = _interopRequireDefault(_CardPileVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MeldVM = (function () {
    function MeldVM(meld) {
        _classCallCheck(this, MeldVM);

        this.type = meld.type;
        this.number = meld.number;
        this.isComplete = meld.isComplete;
        this.meldId = meld._id;
        this.cards = new _CardPileVM2.default(meld.cards);
    }

    _createClass(MeldVM, [{
        key: 'deserialize',
        value: function deserialize() {
            return {
                _id: this.meldId,
                type: this.type,
                number: this.number,
                isComplete: this.isComplete,
                cards: this.cards.deserialize()
            };
        }
    }]);

    return MeldVM;
})();

exports.default = MeldVM;