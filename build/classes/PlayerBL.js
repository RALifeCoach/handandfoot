"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PlayerBL = (function () {
    function PlayerBL(direction, turn, player) {
        _classCallCheck(this, PlayerBL);

        this.player = player;
        this.player.turn = turn;
        this.player.direction = direction;
    }

    _createClass(PlayerBL, [{
        key: "addPerson",
        value: function addPerson(personId) {
            this.player.connected = true;
            if (this.player.person.length === 0) this.player.person.push(personId);
        }
    }, {
        key: "updateHands",
        value: function updateHands(playerVM) {
            if (playerVM.footCards) {
                this.player.footCards = playerVM.footCards.serialize();
            }
            if (playerVM.handCards) {
                this.player.handCards = playerVM.handCards.serialize();
            }
        }
    }, {
        key: "personId",
        get: function get() {
            return this.player.person.length > 0 ? this.player.person[0] : false;
        }
    }, {
        key: "hand",
        get: function get() {
            return this.player.handCards.length > 0 ? this.player.handCards : this.player.footCards;
        }
    }, {
        key: "inFoot",
        get: function get() {
            if (this.player.handCards.length === 0 && this.player.footCards.length === 0) return false;

            return this.player.handCards.length === 0;
        }
    }, {
        key: "connected",
        get: function get() {
            return this.player.connected;
        },
        set: function set(value) {
            this.player.connected = value;
        }
    }, {
        key: "direction",
        get: function get() {
            return this.player.direction;
        }
    }, {
        key: "handCards",
        get: function get() {
            return this.player.handCards;
        }
    }, {
        key: "footCards",
        get: function get() {
            return this.player.footCards;
        }
    }, {
        key: "turn",
        get: function get() {
            return this.player.turn;
        }
    }]);

    return PlayerBL;
})();

exports.default = PlayerBL;