'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _Base2 = require('./Base');

var _Base3 = _interopRequireDefault(_Base2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConnectedGame = (function (_Base) {
    _inherits(ConnectedGame, _Base);

    function ConnectedGame(pGameId) {
        _classCallCheck(this, ConnectedGame);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ConnectedGame).call(this));

        _this.gameId = pGameId;
        _this.sockets = [];
        return _this;
    }

    _createClass(ConnectedGame, [{
        key: 'sendMessages',
        value: function sendMessages(game, receiveSocket, results) {
            var gameVM = game.deserialize();
            var gameObject = {
                playersVM: [],
                otherPlayers: [],
                nsResults: gameVM.results.nsResults,
                ewResults: gameVM.results.ewResults,
                teamsVM: [gameVM.nsTeam, gameVM.ewTeam]
            };

            gameVM.players.forEach(function (player) {
                if (!player) {
                    gameObject.playersVM.push({
                        turn: false,
                        person: false
                    });
                } else {
                    var newPlayer = player.deserialize();
                    newPlayer.turn = false;
                    gameObject.playersVM.push(newPlayer);
                }
            });
            if (gameVM.piles[4].cardPile.cardPile.length) {
                var discardPile = gameVM.piles[4].cardPile.cardPile;
                gameVM.topDiscard = discardPile[discardPile.length - 1].deserialize();
            } else {
                gameVM.topDiscard = false;
            }
            gameVM.piles = gameVM.piles.map(function (pile) {
                return pile.cardPile.cardPile.length;
            });
            gameVM.players = [];
            gameVM.nsTeam = null;
            gameVM.ewTeam = null;
            gameVM.results = false;

            // create player objects used to send basic information (no card details)
            gameObject.playersVM.forEach(function (playerVM) {
                playerVM.myUpdate = false;
                if (!playerVM.person) gameObject.otherPlayers.push({
                    turn: false,
                    person: false,
                    inFoot: false,
                    myUpdate: false
                });else {
                    gameObject.otherPlayers.push({
                        person: playerVM.person,
                        direction: playerVM.direction,
                        turn: false,
                        inFoot: playerVM.inFoot,
                        cards: playerVM.cards.length,
                        myUpdate: false
                    });
                }
            });

            gameObject.playersVM[gameVM.turn].turn = true;
            gameObject.otherPlayers[gameVM.turn].turn = true;

            if (this.sockets.length > 4) {
                this.logger.warn('too many sockets', this.sockets.length);
                this.logger.warn(this.sockets);
            }

            // send update game with players properly ordered
            this.sockets.forEach(function (socketVM) {
                ConnectedGame.sendMessageSocket(socketVM, receiveSocket, gameVM, gameObject, results);
            });
        }
    }], [{
        key: 'sendMessageSocket',
        value: function sendMessageSocket(socketVM, receiveSocket, gameVM, gameObject, results) {
            var socket = socketVM.socket;
            var players = [];
            var teams = [];
            var resultsVM = [];

            switch (socketVM.direction) {
                case 'North':
                    gameObject.playersVM[0].myUpdate = receiveSocket === socket;
                    players.push(gameObject.playersVM[0]);
                    players.push(gameObject.otherPlayers[1]);
                    players.push(gameObject.otherPlayers[2]);
                    players.push(gameObject.otherPlayers[3]);
                    teams.push(gameObject.teamsVM[0]);
                    teams.push(gameObject.teamsVM[1]);
                    resultsVM.push(gameObject.nsResults);
                    resultsVM.push(gameObject.ewResults);
                    break;
                case 'East':
                    gameObject.playersVM[1].myUpdate = receiveSocket === socket;
                    players.push(gameObject.playersVM[1]);
                    players.push(gameObject.otherPlayers[2]);
                    players.push(gameObject.otherPlayers[3]);
                    players.push(gameObject.otherPlayers[0]);
                    teams.push(gameObject.teamsVM[1]);
                    teams.push(gameObject.teamsVM[0]);
                    resultsVM.push(gameObject.ewResults);
                    resultsVM.push(gameObject.nsResults);
                    break;
                case 'South':
                    gameObject.playersVM[2].myUpdate = receiveSocket === socket;
                    players.push(gameObject.playersVM[2]);
                    players.push(gameObject.otherPlayers[3]);
                    players.push(gameObject.otherPlayers[0]);
                    players.push(gameObject.otherPlayers[1]);
                    teams.push(gameObject.teamsVM[0]);
                    teams.push(gameObject.teamsVM[1]);
                    resultsVM.push(gameObject.nsResults);
                    resultsVM.push(gameObject.ewResults);
                    break;
                case 'West':
                    gameObject.playersVM[3].myUpdate = receiveSocket === socket;
                    players.push(gameObject.playersVM[3]);
                    players.push(gameObject.otherPlayers[0]);
                    players.push(gameObject.otherPlayers[1]);
                    players.push(gameObject.otherPlayers[2]);
                    teams.push(gameObject.teamsVM[1]);
                    teams.push(gameObject.teamsVM[0]);
                    resultsVM.push(gameObject.ewResults);
                    resultsVM.push(gameObject.nsResults);
                    break;
                default:
                    throw new Error('unknown direction');
            }

            // if the hand ended, send the results
            if (results) {
                socket.emit('handResults', resultsVM);
            }

            try {
                // send the new data to each player
                socket.emit('gameUpdate', {
                    game: gameVM,
                    players: players,
                    teams: teams,
                    results: resultsVM
                });
            } catch (err) {
                this.logger.fatal(err.stack);
                throw err;
            }
        }
    }]);

    return ConnectedGame;
})(_Base3.default);

exports.default = ConnectedGame;