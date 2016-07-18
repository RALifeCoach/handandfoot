'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _PersonBL = require('../PersonBL');

var _PersonBL2 = _interopRequireDefault(_PersonBL);

var _HandUtil = require('./HandUtil');

var _HandUtil2 = _interopRequireDefault(_HandUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PlayerUtil = (function () {
    function PlayerUtil() {
        _classCallCheck(this, PlayerUtil);
    }

    _createClass(PlayerUtil, null, [{
        key: 'addPlayer',
        value: function addPlayer(gameData, personId, direction) {
            return new Promise(function (resolve, reject) {
                var player = undefined;
                switch (direction) {
                    case 'North':
                        player = gameData.players[0];
                        break;
                    case 'South':
                        player = gameData.players[2];
                        break;
                    case 'East':
                        player = gameData.players[1];
                        break;
                    case 'West':
                        player = gameData.players[3];
                        break;
                    default:
                        throw new Error('unknown direction ' + direction);
                }

                player.addPerson(personId);

                // save the game
                _PersonBL2.default.loadPerson(personId).then(function (person) {
                    switch (direction) {
                        case 'North':
                            gameData.people[0] = person;
                            break;
                        case 'South':
                            gameData.people[2] = person;
                            break;
                        case 'East':
                            gameData.people[1] = person;
                            break;
                        case 'West':
                            gameData.people[3] = person;
                            break;
                        default:
                            throw new Error('unknown direction ' + direction);
                    }

                    var playerCtr = 0;
                    gameData.people.forEach(function (person) {
                        if (person) playerCtr++;
                    });
                    if (playerCtr === 4 && !gameData.game.gameBegun) {
                        _HandUtil2.default.dealNewHand(gameData);
                        _HandUtil2.default.startNewHand(gameData);
                    }

                    resolve();
                }).catch(function (err) {
                    return reject(err);
                });
            });
        }
    }]);

    return PlayerUtil;
})();

exports.default = PlayerUtil;