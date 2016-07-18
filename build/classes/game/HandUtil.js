'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HandUtil = (function () {
    function HandUtil() {
        _classCallCheck(this, HandUtil);
    }

    _createClass(HandUtil, null, [{
        key: 'dealNewHand',
        value: function dealNewHand(gameData) {
            var allCards = [];

            // create array of all cards
            for (var deckIndex = 0; deckIndex < 6; deckIndex++) {
                for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
                    for (var cardIndex = 0; cardIndex < 13; cardIndex++) {
                        allCards.push({
                            suit: suitIndex,
                            number: cardIndex
                        });
                    }
                }
                allCards.push({
                    suit: 4,
                    number: -1
                });
                allCards.push({
                    suit: 4,
                    number: -1
                });
            }

            // load players cards
            for (var playerIndex = 0; playerIndex < 4; playerIndex++) {
                var player = undefined;
                switch (playerIndex) {
                    case 0:
                        //north
                        player = gameData.players[0];
                        break;
                    case 1:
                        //east
                        player = gameData.players[1];
                        break;
                    case 2:
                        //south
                        player = gameData.players[2];
                        break;
                    case 3:
                        //west
                        player = gameData.players[3];
                        break;
                }

                for (var handIndex = 0; handIndex < 2; handIndex++) {
                    var hand = [];
                    for (var _cardIndex = 0; _cardIndex < 11; _cardIndex++) {
                        var cardPosition = Math.floor(Math.random() * allCards.length);
                        hand.push(allCards[cardPosition]);
                        allCards.splice(cardPosition, 1);
                    }

                    switch (handIndex) {
                        case 0:
                            player.player.handCards = hand;
                            break;
                        default:
                            player.player.footCards = hand;
                            break;
                    }
                }
            }

            gameData.game.piles = [{ direction: 'North', cards: [] }, { direction: 'East', cards: [] }, { direction: 'South', cards: [] }, { direction: 'West', cards: [] }, { direction: 'Discard', cards: [] }];

            // load pickup and discard piles
            var pileMax = Math.floor(allCards.length / 4);
            for (var pileIndex = 0; pileIndex < 4; pileIndex++) {
                for (var _cardIndex2 = 0; _cardIndex2 < pileMax; _cardIndex2++) {
                    var _cardPosition = Math.floor(Math.random() * allCards.length);
                    gameData.game.piles[pileIndex].cards.push(allCards[_cardPosition]);
                    allCards.splice(_cardPosition, 1);
                }
            }
        }
    }, {
        key: 'startNewHand',
        value: function startNewHand(gameData) {
            var game = gameData.game;
            game.gameBegun = true;
            game.turn = Math.floor(Math.random() * 4);
            if (game.turn > 3) game.turn = 0;
            game.roundStartingPlayer = game.turn;
            game.turnState = "draw1";
        }
    }, {
        key: 'endTheHand',
        value: function endTheHand(gameData) {
            var game = gameData.game;
            for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
                var team = teamIndex === 0 ? game.nsTeam[0] : game.ewTeam[0];

                team.melds = [];

                team.players.forEach(function (player) {
                    player.handCards = [];
                    player.footCards = [];
                });
            }

            game.piles = [{ direction: 'North', cards: [] }, { direction: 'East', cards: [] }, { direction: 'South', cards: [] }, { direction: 'West', cards: [] }, { direction: 'Discard', cards: [] }];

            // increment the round and end the game if the final round has been played
            if (++game.round > 6) {
                return;
            }

            // deal of the new hand
            HandUtil.dealNewHand();

            // set the next starting player
            if (++game.roundStartingPlayer > 3) game.roundStartingPlayer = 0;
            game.turn = game.roundStartingPlayer;
            game.turnState = 'draw1';
        }
    }]);

    return HandUtil;
})();

exports.default = HandUtil;