'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _Base2 = require('../Base');

var _Base3 = _interopRequireDefault(_Base2);

var _GameVM = require('../../viewmodels/GameVM');

var _GameVM2 = _interopRequireDefault(_GameVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UpdateUtil = (function (_Base) {
    _inherits(UpdateUtil, _Base);

    function UpdateUtil() {
        _classCallCheck(this, UpdateUtil);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(UpdateUtil).apply(this, arguments));
    }

    _createClass(UpdateUtil, null, [{
        key: 'updateGame',
        value: function updateGame(gameData, playerVM, meldsVM, action, control) {
            var game = gameData.game;
            // get the player and team to be updated
            var player;
            var team;
            switch (playerVM.direction) {
                case 'North':
                    player = gameData.players[0];
                    team = gameData.nsTeam;
                    break;
                case 'East':
                    player = gameData.players[1];
                    team = gameData.ewTeam;
                    break;
                case 'South':
                    player = gameData.players[2];
                    team = gameData.nsTeam;
                    break;
                case 'West':
                    player = gameData.players[3];
                    team = gameData.ewTeam;
                    break;
                default:
                    throw new Error('unknown direction ' + playerVM.direction);
            }

            // if this is coming from someone other than the current player then
            // update cards and be done
            if (!playerVM.turn) {
                player.updateHands(playerVM);
                return { updatePlayers: false };
            }

            var updatePlayers = UpdateUtil.updateHands(player, playerVM);

            // update the melds - again notify players if melds being updated
            updatePlayers = meldsVM.unloadTo(updatePlayers, team.melds);

            updatePlayers = UpdateUtil.handleActions(updatePlayers, action, control, game, player);

            updatePlayers = UpdateUtil.updateDrawCards(updatePlayers, control, game);

            var _UpdateUtil$updateTur = UpdateUtil.updateTurnState(updatePlayers, control, game, team);

            var update = _UpdateUtil$updateTur.update;
            var results = _UpdateUtil$updateTur.results;

            updatePlayers = update;

            return { updatePlayers: updatePlayers, results: results };
        }
    }, {
        key: 'updateHands',
        value: function updateHands(player, playerVM) {
            var updatePlayers = false;
            // if the size of the hand or foot has changed then the other players will be notified
            if (playerVM.inFoot) {
                if (player.footCards.length !== playerVM.footCards.cardPile.length) {
                    updatePlayers = true;
                }
            } else {
                if (player.handCards.length !== playerVM.handCards.cardPile.length) {
                    updatePlayers = true;
                }
            }

            // update the hand and foot
            player.updateHands(playerVM);

            return updatePlayers;
        }
    }, {
        key: 'handleActions',
        value: function handleActions(updatePlayers, action, control, game, player) {
            // handle actions
            if (action) {
                updatePlayers = true;
                var cards = player.handCards.length === 0 ? player.footCards : player.handCards;

                if (action.action === "drawCard") {
                    UpdateUtil.drawCard(action, control, cards, game);
                } else if (action.action === "discardCard") {
                    UpdateUtil.discardCard(action, control, cards, game, player);
                } else if (action.action === "drawSevenCards") {
                    UpdateUtil.draw7Cards(cards, game);
                }
            }

            return updatePlayers;
        }
    }, {
        key: 'drawCard',
        value: function drawCard(action, control, cards, game) {
            // draw a card
            if (action.pileIndex < 0 || action.pileIndex > 3) {
                UpdateUtil.loggerWarn('UpdateUtil.drawCard', "PileIndex out of range attempting to draw a card");
                throw new Error("PileIndex out of range attempting to draw a card");
            }

            // set the new turn state
            switch (control.turnState) {
                case 'draw1':
                    control.turnState = 'draw2';
                    break;
                case 'draw2':
                    control.turnState = 'play';
                    break;
                case 'draw3':
                    if (--control.drawCards <= 0) control.turnState = 'play';
                    break;
                default:
                    throw new Error('unknown turnState in drawCard ' + control.turnState);
            }
            // draw the card
            cards.push(game.piles[action.pileIndex].cards.pop());
        }
    }, {
        key: 'discardCard',
        value: function discardCard(action, control, cards, game, player) {
            // discard the selected card
            if (action.cardIndex < 0 || action.cardIndex >= cards.length) {
                UpdateUtil.loggerWarn('UpdateUtil.discardCard', "CardIndex out of range attempting to discard");
                throw new Error("CardIndex out of range attempting to discard");
            }

            control.turnState = 'end';
            game.piles[4].cards.push(cards[action.cardIndex]);
            cards.splice(action.cardIndex, 1);

            // if the discard puts the player into their foot then send a message
            if (!player.inFoot && cards.length === 0) {
                /* send a message */
            }
        }
    }, {
        key: 'draw7Cards',
        value: function draw7Cards(cards, game) {
            // draw seven cards from the discard pile
            // the first card is already moved to the player
            game.piles[4].cards.pop();

            for (var cardIndex = 0; cardIndex < 6 && game.piles[4].cards.length > 0; cardIndex++) {
                cards.push(game.piles[4].cards.pop());
            }
        }
    }, {
        key: 'updateDrawCards',
        value: function updateDrawCards(updatePlayers, control, game) {
            // update draw cards
            if (control.drawCards !== game.drawCards) {
                updatePlayers = true;
                game.drawCards = control.drawCards;
            }

            return updatePlayers;
        }
    }, {
        key: 'updateTurnState',
        value: function updateTurnState(updatePlayers, control, game, team) {
            var results = false;
            // update the turn state
            if (control.turnState !== game.turnState) {
                updatePlayers = true;
                game.turnState = control.turnState;
                // if the hand has ended then perform end of hand routines
                if (control.turnState === 'endHand') {
                    results = _GameVM2.default.scoreTheGame(game, team);
                    _GameVM2.default.endTheHand(game);
                } else if (control.turnState === 'end') {
                    if (++game.turn > 3) game.turn = 0;
                    game.turnState = 'draw1';
                }
            }

            return { update: updatePlayers, results: results };
        }
    }]);

    return UpdateUtil;
})(_Base3.default);

exports.default = UpdateUtil;