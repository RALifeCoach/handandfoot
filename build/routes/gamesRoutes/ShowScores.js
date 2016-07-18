'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _BasePostRouter = require('../BasePostRouter');

var _BasePostRouter2 = _interopRequireDefault(_BasePostRouter);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ObjectId = _mongoose2.default.Types.ObjectId;

var ShowScores = (function (_BaseRouter) {
    _inherits(ShowScores, _BaseRouter);

    function ShowScores(router) {
        _classCallCheck(this, ShowScores);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ShowScores).call(this, router, 'showScores'));

        _this.Person = _mongoose2.default.model('Person');
        return _this;
    }

    _createClass(ShowScores, [{
        key: 'route',
        value: function route(req, res) {
            _get(Object.getPrototypeOf(ShowScores.prototype), 'route', this).call(this);

            var id = new ObjectId(req.body.personId);

            this.Person.aggregate([{
                $match: {
                    _id: id
                }
            }, { $unwind: '$stats' }, {
                $group: {
                    _id: '$stats.gameId',
                    name: { $first: '$name' },
                    dateEnded: { $first: '$stats.dateEnded' },
                    gameName: { $first: '$stats.gameName' },
                    gameId: { $first: '$stats.gameId' },
                    yourTeam: { $first: '$stats.yourTeam' },
                    theirTeam: { $first: '$stats.theirTeam' }
                }
            }, { $sort: { dateEnded: -1 } }, { $unwind: '$yourTeam' }, { $unwind: '$theirTeam' }, {
                $project: {
                    name: 1,
                    gameName: 1,
                    gameId: 1,
                    dateEnded: 1,
                    yourScore: {
                        $cond: {
                            if: { $eq: ['$yourTeam.score', -99999] },
                            then: 'Resigned',
                            else: '$yourTeam.score'
                        }
                    },
                    yourPartner: '$yourTeam.partner',
                    theirScore: {
                        $cond: {
                            if: { $eq: ['$theirTeam.score', -99999] },
                            then: 'Resigned',
                            else: '$theirTeam.score'
                        }
                    },
                    theirPlayer1: '$theirTeam.player1',
                    theirPlayer2: '$theirTeam.player2'
                }
            }, { $unwind: '$yourPartner' }, { $unwind: '$theirPlayer1' }, { $unwind: '$theirPlayer2' }, {
                $project: {
                    name: 1,
                    gameName: 1,
                    gameId: 1,
                    dateEnded: 1,
                    yourScore: 1,
                    yourPartner: '$yourPartner.name',
                    theirScore: 1,
                    theirPlayer1: '$theirPlayer1.name',
                    theirPlayer2: '$theirPlayer2.name'
                }
            }], function (err, result) {
                if (err) {
                    this.logger.fatal(err);
                    return;
                }
                res.json(result);
            });
        }
    }]);

    return ShowScores;
})(_BasePostRouter2.default);

exports.default = ShowScores;