'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _CardPileVM = require('./CardPileVM');

var _CardPileVM2 = _interopRequireDefault(_CardPileVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PlayerVM = (function () {
    function PlayerVM(person) {
        _classCallCheck(this, PlayerVM);

        if (!person) {
            this.person = false;
            return;
        }

        this.person = {
            id: person.id,
            name: person.name
        };
    }

    _createClass(PlayerVM, [{
        key: 'loadPlayer',
        value: function loadPlayer(player) {
            this.direction = player.direction;
            this.connected = player.connected;
            this.turn = player.turn;
            if (player.cards) {
                this.footCards = player.inFoot ? new _CardPileVM2.default(player.cards) : null;
                this.handCards = player.inFoot ? null : new _CardPileVM2.default(player.cards);
            } else {
                this.footCards = new _CardPileVM2.default(player.footCards);
                this.handCards = new _CardPileVM2.default(player.handCards);
            }
            this.inFoot = player.inFoot;
        }
    }, {
        key: 'deserialize',
        value: function deserialize() {
            return {
                person: {
                    id: this.person.id,
                    name: this.person.name
                },
                direction: this.direction,
                connected: this.connected,
                turn: this.turn,
                cards: this.inFoot ? this.footCards.deserialize() : this.handCards.deserialize(),
                inFoot: this.inFoot,
                myUpdate: false
            };
        }
    }, {
        key: 'name',
        get: function get() {
            return this.person.name;
        }
    }, {
        key: 'hasPerson',
        get: function get() {
            return this.person !== false;
        }
    }, {
        key: 'hand',
        get: function get() {
            return this.inFoot ? this.footCards : this.handCards;
        }
    }]);

    return PlayerVM;
})();

exports.default = PlayerVM;