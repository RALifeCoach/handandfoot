import BaseRouter from '../BaseRouter';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

export default class ShowScores extends BaseRouter {
    constructor(router) {
        super(router, 'showScores');
        this.Person = mongoose.model('Person');
    }
    
    route(req, res) {
        super.route();

        var id = new ObjectId(req.body.personId);

        this.Person.aggregate([
            {
                $match: {
                    _id: id
                }
            },
            {$unwind: '$stats'},
            {
                $group: {
                    _id: '$stats.gameId',
                    name: {$first: '$name'},
                    dateEnded: {$first: '$stats.dateEnded'},
                    gameName: {$first: '$stats.gameName'},
                    gameId: {$first: '$stats.gameId'},
                    yourTeam: {$first: '$stats.yourTeam'},
                    theirTeam: {$first: '$stats.theirTeam'}
                }
            },
            {$sort: {dateEnded: -1}},
            {$unwind: '$yourTeam'},
            {$unwind: '$theirTeam'},
            {
                $project: {
                    name: 1,
                    gameName: 1,
                    gameId: 1,
                    dateEnded: 1,
                    yourScore: {
                        $cond: {
                            if: {$eq: ['$yourTeam.score', -99999]},
                            then: 'Resigned',
                            else: '$yourTeam.score'
                        }
                    },
                    yourPartner: '$yourTeam.partner',
                    theirScore: {
                        $cond: {
                            if: {$eq: ['$theirTeam.score', -99999]},
                            then: 'Resigned',
                            else: '$theirTeam.score'
                        }
                    },
                    theirPlayer1: '$theirTeam.player1',
                    theirPlayer2: '$theirTeam.player2'
                }
            },
            {$unwind: '$yourPartner'},
            {$unwind: '$theirPlayer1'},
            {$unwind: '$theirPlayer2'},
            {
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
            }
        ], function (err, result) {
            if (err) {
                this.logger.fatal(err);
                return;
            }
            res.json(result);
        });
    }
}