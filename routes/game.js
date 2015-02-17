'use strict';

var express = require('express');
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Person = mongoose.model('Person');
var Hint = mongoose.model('Hint');
var HelpText = mongoose.model('HelpText');

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
		game.numberOfPlayers = 4;
		for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
			var team = { 
				score: 0, 
				redThrees: 0, 
				melds: [], 
				players: [],
				results: []
			};
			for (var personIndex = 0; personIndex < 2; personIndex++) {
				team.players.push({ 
					personOffset: -1, 
					position: personIndex * 2 + teamIndex, 
					connected: false, 
					handCards: [], 
					footCards: []
				});
			}
			game.teams.push(team);
		}
		
		game.drawPiles = [
			{ cards: [] },
			{ cards: [] },
			{ cards: [] },
			{ cards: [] }
		];
		game.discardPile = {
			cards: []
		};
		game.people = [];

		game.save(function(err, game){
			if (err) { 
				console.log(err.stack);
				return next(err); 
			}

			res.json(mapper.mapToVM(game));

			// broadcast to all players
			io.sockets.emit('refreshGames');
		});
	});

	return router;
};
