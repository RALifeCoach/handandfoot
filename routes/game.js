import * as express from 'express';
import * as GameVM from '../viewmodels/GameVM';
import * as gameUtil from '../classes/game/GameUtil';

import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

export class Router {
	constructor(io) {
		let mapper = new GameVM.GameVM();
		let Person = mongoose.model('Person');
		let Hint = mongoose.model('Hint');
		let HelpText = mongoose.model('HelpText');
		io.on('connection', function (socket) {
			console.log('game connection');
		});

		var router = express.Router();

		router.post('/getAll', function(req, res, next) {
			gameUtil.turnOffConnected(req.body.personId)
			.then(() => {
				// find games that are not complete
				return mapper.getAllIncompleteGames(req.body.personId);
			})
			.then(gamesVM => {
				res.json(gamesVM);
			})
			.catch(err => {
				console.log(err);
				console.log(err.stack);
				next(err)
			});
		});

    router.post('/showScores', function(req, res, next) {
        var id = new ObjectId(req.body.personId);

        Person.aggregate([
            { $match: {
                _id: id
            }},
            { $unwind: '$stats' },
            { $group: {
                _id: '$stats.gameId',
                name: {$first: '$name'},
                dateEnded: {$first: '$stats.dateEnded'},
                gameName: {$first: '$stats.gameName'},
                gameId: {$first: '$stats.gameId'},
                yourTeam: {$first: '$stats.yourTeam'},
                theirTeam: {$first: '$stats.theirTeam'}
            }},
            { $sort: {dateEnded: -1} },
            { $unwind: '$yourTeam' },
            { $unwind: '$theirTeam' },
            { $project: {
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
            }},
            { $unwind: '$yourPartner' },
            { $unwind: '$theirPlayer1' },
            { $unwind: '$theirPlayer2' },
            { $project: {
                name: 1,
                gameName: 1,
                gameId: 1,
                dateEnded: 1,
                yourScore: 1,
                yourPartner: '$yourPartner.name',
                theirScore: 1,
                theirPlayer1: '$theirPlayer1.name',
                theirPlayer2: '$theirPlayer2.name'
            }},
        ], function(err, result) {
            if (err) {
                console.log(err)
                return;
            }
            res.json(result);
        });
    });

		router.get('/getHints', function(req, res, next) {
			Hint.find(function(err, hints){
				res.json(hints);
			});
		});

		router.get('/getHelp', function(req, res, next) {
			HelpText.find(function(err, help){
				if (err) {
					console.log(err);
					return next(err);
				}

				res.json(help[0]);
			});
		});

		router.post('/', function(req, res, next) {
			gameUtil.createGame(req.body.game.name, req.body.game.password)
			.then(game => {
				return game.save();
			})
			.then(game => {
				res.json(mapper.mapToVM(game));

				// broadcast to all players
				io.sockets.emit('refreshGames');
			})
			.catch(err => {
				console.log(err.stack);
				next(err);
			});
		});

		return router;
	}
}
