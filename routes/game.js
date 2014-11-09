var express = require('express');
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Person = mongoose.model('Person');

module.exports = function(mapper) {
	var router = express.Router();

	router.post('/getAll', function(req, res, next) {
		// update DB to turn off connected flag for person
		Person.update( { 'nsTeam[0].players.person._id': req.body.personId }, 
			{'$set': {
				'nsTeam[0].players.$.connected': false
			}}, function(err) {
				if (err) { return next(err); }
				Person.update( { 'ewTeam[0].players.person._id': req.body.personId }, 
					{'$set': {
						'ewTeam[0].players.$.connected': false
					}}, function(err) {
						if (err) { return next(err); }

						// find games that are not complete
						Game.find().where({gameComplete: false}).exec(function(err, games){
							if(err){ return next(err); }

							var gamesVM = [];
							var ctr = games.length;
							for (var gameIndex = 0; gameIndex < games.length; gameIndex++) {
								mapper.mapToVM(games[gameIndex], function(err, gameVM) {
									if (err) { return next(err); }

									gameVM.playerAttached = false;
									for (var playerIndex = 0; playerIndex < gameVM.players.length; playerIndex++) {
										if (gameVM.players[playerIndex].person 
										&& gameVM.players[playerIndex].person.id.toString() === req.body.personId.toString()) {
											gameVM.playerAttached = true;
											break;
										}
									}
									
									// add game if it is still awaiting players
									if (!gameVM.playersFull || gameVM.playerAttached)
										gamesVM.push(gameVM);

									// when all games have been mapped to gameVM return the message to the front end
									if (--ctr === 0) {
										console.log('send games');
										res.json(gamesVM);
									}
								});
							}
						});
					});
			});
	});

	router.post('/', function(req, res, next) {
		var game = new Game(req.body);
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
			});
		});
	});

	return router;
};
