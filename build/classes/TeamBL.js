'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TeamBL = (function () {
    function TeamBL(team) {
        _classCallCheck(this, TeamBL);

        this.cardScores = [20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 20];
        if (team) {
            this.team = team;
        } else {
            var player = { person: [], direction: '', handCards: [], footCards: [] };
            this.team = { score: 0, players: [player, player], melds: [] };
        }
    }

    _createClass(TeamBL, [{
        key: 'scoreTeam',

        // score the team
        value: function scoreTeam(winningTeam) {
            var _this = this;

            var scores = {
                baseScore: 0,
                cardsScore: 0,
                priorScore: 0
            };

            // add 100 points for going out first
            if (this.team === winningTeam) scores.baseScore += 100;

            // score the team's melds
            this.team.melds.forEach(function (meld) {
                if (meld.type === 'Red Three') {
                    scores.baseScore += 100;
                } else {
                    switch (meld.type) {
                        case 'Clean Meld':
                            scores.baseScore += meld.isComplete ? 500 : 0;
                            break;
                        case 'Dirty Meld':
                            scores.baseScore += meld.isComplete ? 300 : 0;
                            break;
                        case 'Run':
                            scores.baseScore += meld.isComplete ? 2000 : -2000;
                            break;
                        case 'Wild Card Meld':
                            scores.baseScore += meld.isComplete ? 1000 : -1000;
                            break;
                    }

                    // score the cards in the meld
                    meld.cards.forEach(function (card) {
                        if (card.suit === 4) scores.cardsScore += 50;else scores.cardsScore += _this.cardScores[card.number];
                    });
                }
            });

            // now score the cards left in players hands
            this.team.players.forEach(function (player) {
                for (var handIndex = 0; handIndex < 2; handIndex++) {
                    var cards = handIndex === 0 ? player.handCards : player.footCards;
                    cards.forEach(function (card) {
                        if (card.suit === 4) scores.cardsScore -= 50;else if (card.number === 2 && (card.suit === 1 || card.suit === 2))
                            // red three
                            scores.cardsScore -= 100;else scores.cardsScore -= _this.cardScores[card.number];
                    });
                }
            });

            scores.priorScore = this.team.score;
            this.team.score += scores.baseScore + scores.cardsScore;

            return scores;
        }
    }, {
        key: 'score',
        get: function get() {
            return this.team.score;
        }
    }, {
        key: 'melds',
        get: function get() {
            return this.team.melds;
        }
    }, {
        key: 'name',
        get: function get() {
            return this.player.person.length > 0 ? this.player.persob[0].name : false;
        }
    }]);

    return TeamBL;
})();

exports.default = TeamBL;