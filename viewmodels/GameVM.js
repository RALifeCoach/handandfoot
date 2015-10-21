import * as PlayerVM from './PlayerVM';
import * as MeldsVM from './MeldsVM';
import * as CardPileVM from './CardPileVM';
import * as CardVM from './CardVM';
import * as gameUtil from '../classes/game/GameUtil';
import * as personBL from '../classes/personBL';

const cardScores = [ 20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 20];

export class GameVM {
	constructor(game) {
		this.game = game;
	}

	// move card data from gameVM to game
	unloadCards(inPile, outPile) {
		var inCount = inPile.length;
		var outCount = outPile.length;
		var combinedCount = inCount < outCount ? inCount : outCount;

		// update cards for cards in both piles
		for (var cardIndex = 0; cardIndex < combinedCount; cardIndex++) {
			outPile[cardIndex].suit = inPile.cards[cardIndex].suitNumber;
			outPile[cardIndex].number = inPile.cards[cardIndex].cardNumber;
		}

		// if the in pile has more cards then add to out pile
		for (var cardIndex = combinedCount; cardIndex < inCount; cardIndex++) {
			outPile.push({
				suit: inPile.cards[cardIndex].suitNumber,
				number: inPile.cards[cardIndex].cardNumber
			});
		}

		// if the out pile has more cards then delete them
		if (outPile.length > combinedCount) {
			outPile.splice(combinedCount, outCount - combinedCount);
		}
	}

	scoreTheGame(game, winningTeam) {
		return game.score(winningTeam);
	}

	addStats(game, direction, youResigned, theyResigned, callback) {
		let _this = this;
		let results = game.buildStats(direction, youResigned, theyResigned);
		// update the person document

		let person = game.person(direction);
		person.stats.push(results.stat);

		return new Promise((resolve, reject) => {
			person.save()
			.then(() => resolve(_this))
			.catch(err => reject(err));
		});
	}

	// update players - record scores
	updatePlayers(game, personId) {
		var nsResigned = false;
		var ewResigned = false;
		if (personId) {
			if (personId.toString() === game.players('North').personId.toString()
			|| personId.toString() === game.players('South').personId.toString())
				nsResigned = true;
			else
				ewResigned = true;
		}

		return new Promise((resolve, reject) => {
			let results;
			results = game.buildStats('North', nsResigned, ewResigned);
			this.person('North').addStats(results.stat)
			.then(() => {
				results = game.buildStats('South', nsResigned, ewResigned);
				return this.person('South').addStats(results.stat);
			})
			.then(() => {
				results = game.buildStats('East', ewResigned, nsResigned);
				return this.person('East').addStats(results.stat);
			})
			.then(() => {
				results = game.buildStats('West', ewResigned, nsResigned);
				return this.person('West').addStats(results.stat);
			})
			.then(() => resolve() )
			.catch(err => {
				console.log(err.stack);
				reject(err);
			});
		});
	}

	getAllIncompleteGames(personId) {
		var _this = this;

		return new Promise((resolve, reject) => {
			gameUtil.findIncompleteGames()
			.then(games => {
				var gamesVM = [];
				var ctr = games.length;
				games.forEach(game => {
					game.finishLoading()
					.then(() => {
						let gameVM = game.deserialize();

						gameVM.playerAttached = false;
						gameVM.players.forEach(player => {
							if (player.person
							&& player.person.id.toString() === personId.toString()) {
								gameVM.playerAttached = true;
							}
						});

						// add game if it is still awaiting players
						if (!gameVM.playersFull || gameVM.playerAttached)
							gamesVM.push(gameVM);

						// when all games have been mapped to gameVM return the message to the front end
						if (--ctr === 0) {
							resolve(gamesVM);
						}
					});
				});
			})
			.catch(err => reject(err));
		});
	}

	addPlayer(gameId, personId, direction) {
		let _this = this;
		return new Promise((resolve, reject) => {
			gameUtil.loadGame(gameId)
			.then(game => {
				return game.addPlayer(personId, direction);
			})
			.then(game => {
				resolve(game);
			})
			.catch(err => reject(err));
		});
	}

	// no promise required as it does not return a message
	removePlayer(gameId, personId) {
		let _this = this;

		return new Promise((resolve, reject) => {
			gameUtil.loadGame(gameId)
			.then(game => {
				// create the existing player
				var player = false;
				if (game.player('North') && game.player('North').personId.toString() === personId.toString())
					player = game.player('North');
				else if (game.player('South') && game.player('South').personId.toString() === personId.toString())
					player = game.player('South');
				else if (game.player('East') && game.player('East').personId.toString() === personId.toString())
					player = game.player('East');
				else if (game.player('West') && game.player('West').personId.toString() === personId.toString())
					player = game.player('West');

				if (!player) {
					console.log('player not found in game');
					console.log(personId);
					console.log(game.nsTeam[0].players);
					console.log(game.ewTeam[0].players);
					return callback(new Error('player not found in game'));
				}

				player.connected = false;

				// save the game
				return game.save();
			})
			.then(game => {
				resolve(game.deserialize());
			})
			.catch(err => callback(err));
		});
	}

	// update cards from message from a game
	updateGame(gameId, playerVM, meldsVM, action, control) {
		var _this = this;

		return new Promise((resolve, reject) => {
			// find game from DB
			let playerVMClass = new PlayerVM.PlayerVM();
			playerVMClass.loadPlayer(playerVM);
			gameUtil.loadGame(gameId)
			.then(game => {
				return game.updateGame(playerVMClass,
					new MeldsVM.MeldsVM(meldsVM),
					action,
					control);
			})
			.then((game, results) => {
				// if the game is complete, update the stats
				if (game.gameComplete) {
					_this.updatePlayers(game, false)
					.then(() => {
						resolve(game, results);
					});
				} else {
					resolve(game, results);
				}
			})
			.catch(err => {
				console.log(err.stack);
				reject(err);
			});
		})
	};

	// end the game
	endGame(gameId, personId, callback) {
		var _this = this;
		// find game from DB
		gameUtil.loadGame(gameId)
		.then(game => {
			_this.scoreTheGame(game, null);
			_this.endTheGame(game);

			// save the game
			game.save(function(err, savedGame){
				if (err) {
					console.log('error saving game');
					console.log(err.stack);
					console.log(game);
					return callback(err);
				}

				_this.updatePlayers(game, personId, function(err) {
					return callback(err, game);
				});
			});
		})
		.catch(err => callback(err));
	};
}
