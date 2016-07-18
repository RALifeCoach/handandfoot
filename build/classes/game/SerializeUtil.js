'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _GamePileVM = require('../../viewmodels/GamePileVM');

var _GamePileVM2 = _interopRequireDefault(_GamePileVM);

var _MeldVM = require('../../viewmodels/MeldVM');

var _MeldVM2 = _interopRequireDefault(_MeldVM);

var _PlayerVM = require('../../viewmodels/PlayerVM');

var _PlayerVM2 = _interopRequireDefault(_PlayerVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SerializeUtil = (function () {
    function SerializeUtil() {
        _classCallCheck(this, SerializeUtil);
    }

    _createClass(SerializeUtil, null, [{
        key: 'deserialize',

        // deserialize into GameVM
        value: function deserialize(gameData) {
            var game = gameData.game;
            var gameVM = {
                _id: game.id,
                name: game.name,
                startDate: game.startDate,
                lastPlayedDate: game.lastPlayedDate,
                round: game.round,
                roundStartingPlayer: game.roundStartingPlayer,
                currentPlayer: game.currentPlayer,
                nsTeam: {
                    score: gameData.nsTeam.score,
                    melds: this.loadMelds(gameData.nsTeam.melds),
                    counts: this.countMelds(gameData.nsTeam.melds)
                },
                ewTeam: {
                    score: game.ewTeam.score,
                    melds: this.loadMelds(gameData.ewTeam.melds),
                    counts: this.countMelds(gameData.ewTeam.melds)
                },
                players: [],
                piles: [new _GamePileVM2.default('North', game.piles[0].cards), new _GamePileVM2.default('East', game.piles[1].cards), new _GamePileVM2.default('South', game.piles[2].cards), new _GamePileVM2.default('West', game.piles[3].cards), new _GamePileVM2.default('Discard', game.piles[4].cards)],
                gameBegun: game.gameBegun,
                turn: game.turn,
                turnState: game.turnState,
                drawCards: game.drawCards,
                gameComplete: game.gameComplete,
                results: this.loadResults(game.roundsPlayed)
            };

            this.deserializePlayers(gameData, gameVM);

            return gameVM;
        }

        // move melds from game to gameVM

    }, {
        key: 'loadMelds',
        value: function loadMelds(inMelds) {
            return inMelds.map(function (meld) {
                return new _MeldVM2.default(meld).deserialize();
            });
        }

        // count meld types

    }, {
        key: 'countMelds',
        value: function countMelds(inMelds) {
            var counts = [{ type: 'Red Threes', count: 0 }, { type: 'Clean Melds', count: 0, melds: "" }, { type: 'Dirty Melds', count: 0, melds: "" }, { type: 'Runs', count: 0, melds: "" }, { type: 'Wild Card Melds', count: 0 }];

            inMelds.forEach(function (meld) {
                if (meld.isComplete) {
                    switch (meld.type) {
                        case "Red Three":
                            counts[0].count++;
                            break;
                        case "Clean Meld":
                            counts[1].count++;
                            counts[1].melds += counts[1].melds === "" ? cards[meld.number] : ", " + cards[meld.number];
                            break;
                        case "Dirty Meld":
                            counts[2].count++;
                            counts[2].melds += counts[2].melds === "" ? cards[meld.number] : ", " + cards[meld.number];
                            break;
                        case "Run":
                            counts[3].count++;
                            break;
                        case "Wild Card Meld":
                            counts[4].count++;
                            break;
                        default:
                            throw new Error('unknown meld type ' + meld.type);
                    }
                }
            });

            return counts;
        }

        // load the rounds played into results

    }, {
        key: 'loadResults',
        value: function loadResults(roundsPlayed) {
            var results = {
                nsResults: [],
                ewResults: []
            };
            for (var roundIndex = 0; roundIndex < roundsPlayed.length; roundIndex++) {
                var nsTeam = {
                    round: roundsPlayed[roundIndex].round,
                    baseScore: roundsPlayed[roundIndex].nsTeam.baseScore,
                    cardsScore: roundsPlayed[roundIndex].nsTeam.cardsScore,
                    priorScore: roundsPlayed[roundIndex].nsTeam.priorScore,
                    handScore: roundsPlayed[roundIndex].nsTeam.baseScore + roundsPlayed[roundIndex].nsTeam.cardsScore,
                    newScore: roundsPlayed[roundIndex].nsTeam.baseScore + roundsPlayed[roundIndex].nsTeam.cardsScore + roundsPlayed[roundIndex].nsTeam.priorScore
                };
                results.nsResults.push(nsTeam);
                var ewTeam = {
                    round: roundsPlayed[roundIndex].round,
                    baseScore: roundsPlayed[roundIndex].ewTeam.baseScore,
                    cardsScore: roundsPlayed[roundIndex].ewTeam.cardsScore,
                    priorScore: roundsPlayed[roundIndex].ewTeam.priorScore,
                    handScore: roundsPlayed[roundIndex].ewTeam.baseScore + roundsPlayed[roundIndex].ewTeam.cardsScore,
                    newScore: roundsPlayed[roundIndex].ewTeam.baseScore + roundsPlayed[roundIndex].ewTeam.cardsScore + roundsPlayed[roundIndex].ewTeam.priorScore
                };
                results.ewResults.push(ewTeam);
            }
            return results;
        }

        // deserialize the players

    }, {
        key: 'deserializePlayers',
        value: function deserializePlayers(gameData, gameVM) {
            var playerVM = undefined;
            if (!gameData.people[0]) {
                gameVM.players.push(false);
            } else {
                playerVM = new _PlayerVM2.default(gameData.people[0]);
                playerVM.loadPlayer(gameData.players[0]);
                gameVM.players.push(playerVM);
            }

            if (!gameData.people[1]) {
                gameVM.players.push(false);
            } else {
                playerVM = new _PlayerVM2.default(gameData.people[1]);
                playerVM.loadPlayer(gameData.players[1]);
                gameVM.players.push(playerVM);
            }

            if (!gameData.people[2]) {
                gameVM.players.push(false);
            } else {
                playerVM = new _PlayerVM2.default(gameData.people[2]);
                playerVM.loadPlayer(gameData.players[2]);
                gameVM.players.push(playerVM);
            }

            if (!gameData.people[3]) {
                gameVM.players.push(false);
            } else {
                playerVM = new _PlayerVM2.default(gameData.people[3]);
                playerVM.loadPlayer(gameData.players[3]);
                gameVM.players.push(playerVM);
            }

            var players = 0;
            gameVM.players.forEach(function (playerVM) {
                if (playerVM.hasPerson) players++;
            });
            gameVM.playersFull = players === 4;
        }
    }]);

    return SerializeUtil;
})();

exports.default = SerializeUtil;