'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _MeldVM = require('./MeldVM');

var _MeldVM2 = _interopRequireDefault(_MeldVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MeldsVM = (function () {
    function MeldsVM(melds) {
        _classCallCheck(this, MeldsVM);

        this.melds = melds.map(function (meld) {
            return new _MeldVM2.default(meld);
        });
    }

    // move meld data from gameVM to game

    _createClass(MeldsVM, [{
        key: 'unloadTo',
        value: function unloadTo(updatePlayers, outMelds) {
            // create a map of the outMelds
            var mapMelds = {};
            outMelds.forEach(function (meld) {
                mapMelds[meld._id.toString()] = meld;
            });
            // update melds for melds in both versions
            // there will always be the same or more melds in this class than
            // in the outMelds - loop through them, look for a match, if not found
            // add it
            var results = [];
            this.melds.forEach(function (inMeld) {
                var outMeld = mapMelds[inMeld.meldId];
                if (!outMeld) {
                    updatePlayers = true;
                    outMeld = {
                        type: inMeld.type,
                        number: inMeld.number,
                        isComplete: inMeld.isComplete,
                        cards: inMeld.cards.serialize()
                    };
                } else if (outMeld.cards.length !== inMeld.cards.length) {
                    updatePlayers = true;
                    outMeld.cards = inMeld.cards.serialize();
                }
                results.push(outMeld);
            });

            // now refill the outMeld
            outMelds.splice(0, outMelds.length);
            results.forEach(function (meld) {
                return outMelds.push(meld);
            });
            return updatePlayers;
        }
    }]);

    return MeldsVM;
})();

exports.default = MeldsVM;