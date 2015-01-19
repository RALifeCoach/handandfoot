var express = require('express');
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Person = mongoose.model('Person');
var Hint = mongoose.model('Hint');
var HelpText = mongoose.model('HelpText');

module.exports = function(mapper) {
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
	console.log(help);
			res.json(help[0]);
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
