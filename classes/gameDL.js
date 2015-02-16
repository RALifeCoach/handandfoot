'use strict';

var mongoose = require('mongoose');
var Game = mongoose.model('Game');

module.exports = (function() {
	return {
		getGameById: function(gameId, callback) {
			Game
				.findById(gameId)
				.populate('people')
				.exec(function(err, game) {
					if (err) {
						console.log('cannot find game with id: ' + gameId);
						console.log(err.stack);
						return callback(err);
					}
					if (!game) {
						console.log('cannot find game with id: ' + gameId);
						return callback(new Error('Cannot find game with id: ' + gameId));
					}

					callback(null, game);
				});
		}
		, getIncompleteGames: function(callback) {
			Game
				.find()
				.populate('people')
				.where({gameComplete: false})
				.exec(function(err, games){
					if (err) {
						console.log('error finding incomplete games');
						console.log(err.stack);
						return callback(err);
					}
					callback(null, games);
				});
		}
		, save: function(game, callback) {
			game.save(function(err, savedGame) {
				if (err) { 
					console.log('error saving game');
					console.log(err.stack);
					console.log(JSON.stringify(game));
					return callback(err); 
				}
				callback(null, savedGame);
			});
		}
	};
})();