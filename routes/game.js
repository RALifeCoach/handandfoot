var express = require('express');
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Person = mongoose.model('Person');
var Hint = mongoose.model('Hint');
var HelpText = mongoose.model('HelpText');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = function(io, mapper) {
	io.on('connection', function (socket) {
		console.log('game connection');
	});
	
	var router = express.Router();
	
	router.post('/getAll', function(req, res, next) {
		// update DB to turn off connected flag for person
		Game.update( { 'nsTeam[0].players.person._id': req.body.personId }, 
			{'$set': {
				'nsTeam[0].players.$.connected': false
			}}, function(err) {
				if (err)
					return next(err);
				Game.update( { 'ewTeam[0].players.person._id': req.body.personId }, 
					{'$set': {
						'ewTeam[0].players.$.connected': false
					}}, function(err) {
						if (err)
							return next(err);

						// find games that are not complete
						mapper.getAllIncompleteGames(req.body.personId, function(err, gamesVM){
							if(err)
								return next(err);

							res.json(gamesVM);
						});
					}
				);
			}
		);
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
		var game = new Game(req.body.game);
		var player = { person: [], direction: '', handCards: [], footCards: []};
		var team = { score: 0, players: [player, player]};
		
		game.nsTeam.push(team);
		game.ewTeam.push(team);
		game.piles = [
			{ direction: 'North', cards: [] },
			{ direction: 'East', cards: [] },
			{ direction: 'South', cards: [] },
			{ direction: 'West', cards: [] },
			{ direction: 'Discard', cards: [] }
		];

		mapper.mapToVM(game, function(err, gameVM) {
			if (err) 
				return next(err);
			game.save(function(err, game){
				if(err){ return next(err); }

				res.json(gameVM);

				// broadcast to all players
				io.sockets.emit('refreshGames');
			});
		});
	});

	return router;
};
