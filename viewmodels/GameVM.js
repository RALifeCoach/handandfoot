import * as PlayerVM from './PlayerVM';
import * as CardPileVM from './CardPileVM';
import * as CardVM from './CardVM';
import * as MeldVM from './MeldVM';
import * as gameUtil from '../classes/gameUtil';
import * as personBL from '../classes/personBL';

const cardScores = [ 20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 20];

export class GameVM {
	constructor() {
	}
	loadPlayer(player) {
		return new Promise((resolve, reject) => {
			personBL.loadPerson(player.person[0])
			.then(dbPerson => {
				let playerVM = new PlayerVM.PlayerVM(dbPerson);
				playerVM.loadPlayer(player);
				resolve(playerVM);
			})
			.catch(err => reject(err));
		});
	}

	// move melds from game to gameVM
	loadMelds(inMelds) {
		let outMelds = [];

		inMelds.forEach(meld => outMelds.push(new MeldVM.MeldVM(meld)));

		return outMelds;
	}

	// count meld types
	countMelds(inMelds) {
		var counts = [
			{type: 'Red Threes', count: 0},
			{type: 'Clean Melds', count: 0, melds: ""},
			{type: 'Dirty Melds', count: 0, melds: ""},
			{type: 'Runs', count: 0, melds: ""},
			{type: 'Wild Card Melds', count: 0}
		];

		inMelds.forEach(meld => {
			if (meld.isComplete) {
				switch (meld.type) {
					case "Red Three":
						counts[0].count++;
						break;
					case "Clean Meld":
						counts[1].count++;
						counts[1].melds += counts[1].melds === ""
							? cards[meld.number]
							: ", " + cards[meld.number];
						break;
					case "Dirty Meld":
						counts[2].count++;
						counts[2].melds += counts[2].melds === ""
							? cards[meld.number]
							: ", " + cards[meld.number];
						break;
					case "Run":
						counts[3].count++;
						break;
					case "Wild Card Meld":
						counts[4].count++;
						break;
				}
			}
		});

		return counts;
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

	// move meld data from gameVM to game
	unloadMelds(inMelds, outMelds) {
		var updatePlayers = false;
		var inCount = inMelds.length;
		var outCount = outMelds.length;
		var combinedCount = inCount < outCount ? inCount : outCount;

		// update melds for melds in both versions
		for (var meldIndex = 0; meldIndex < combinedCount; meldIndex++) {
			if (outMelds[meldIndex].isComplete !== inMelds[meldIndex].isComplete) {
				outMelds[meldIndex].isComplete = inMelds[meldIndex].isComplete;
				updatePlayers = true;
			}
			if (outMelds[meldIndex].type !== inMelds[meldIndex].type) {
				outMelds[meldIndex].type = inMelds[meldIndex].type;
				updatePlayers = true;
			}
			if (outMelds[meldIndex].number !== inMelds[meldIndex].number) {
				outMelds[meldIndex].number = inMelds[meldIndex].number;
				updatePlayers = true;
			}
			if (outMelds[meldIndex].cards.length !== inMelds[meldIndex].cards.length)
				updatePlayers = true;
			this.unloadCards(inMelds[meldIndex].cards, outMelds[meldIndex].cards);
		}

		// if the in melds has more melds than the out melds then add them
		for (var meldIndex = combinedCount; meldIndex < inCount; meldIndex++) {
			updatePlayers = true;
			var meld = {
				type: inMelds[meldIndex].type,
				number: inMelds[meldIndex].number,
				isComplete: inMelds[meldIndex].isComplete,
				cards: []
			};
			this.unloadCards(inMelds[meldIndex].cards, meld.cards);

			outMelds.push(meld);
		}

		return updatePlayers;
	}

	// load the player names
	loadPlayers(game, gameVM, callback) {
		let playerVM;
		if (!game.person('North')) {
			gameVM.players.push(false);
		} else {
			playerVM = new PlayerVM.PlayerVM(game.person('North'));
			playerVM.loadPlayer(game.player('North'));
			gameVM.players.push(playerVM);
		}

		if (!game.person('East')) {
			gameVM.players.push(false);
		} else {
			playerVM = new PlayerVM.PlayerVM(game.person('East'));
			playerVM.loadPlayer(game.player('East'));
			gameVM.players.push(playerVM);
		}

		if (!game.person('South')) {
			gameVM.players.push(false);
		} else {
			playerVM = new PlayerVM.PlayerVM(game.person('South'));
			playerVM.loadPlayer(game.player('South'));
			gameVM.players.push(playerVM);
		}

		if (!game.person('West')) {
			gameVM.players.push(false);
		} else {
			playerVM = new PlayerVM.PlayerVM(game.person('West'));
			playerVM.loadPlayer(game.player('West'));
			gameVM.players.push(playerVM);
		}

		var players = 0;
		gameVM.players.forEach(playerVM => {
			if (playerVM.hasPerson)
				players++;
		});
		gameVM.playersFull = players === 4;
	}
	// score the game
	scoreTheGame(game, winningTeam) {
		var results = {
			nsTeam: {
				baseScore: 0,
				cardsScore: 0,
				priorScore: 0
			},
			ewTeam: {
				baseScore: 0,
				cardsScore: 0,
				priorScore: 0
			}
		};

		for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
			var team, scores;
			if (teamIndex === 0) {
				team = game.nsTeam[0];
				scores = results.nsTeam;
			} else {
				team = game.ewTeam[0];
				scores = results.ewTeam;
			}

			var baseScore = 0;
			// add 100 points for going out first
			if (team == winningTeam)
				scores.baseScore += 100;

			// score the team's melds
			for (var meldIndex = 0; meldIndex < team.melds.length; meldIndex++) {
				var meld = team.melds[meldIndex];
				switch (meld.type) {
					case 'Red Three':
						scores.baseScore += 100;
						continue;
					case 'Clean Meld':
						scores.baseScore += meld.isComplete ? 500 : 0;
						break;
					case 'Dirty Meld':
						scores.baseScore += meld.isComplete ? 300 : 0;
						break;
					case 'Run':
						scores.baseScore += meld.isComplete ? 2000 : -2000;
						break;
					case 'Wild Card Meld':
						scores.baseScore += meld.isComplete ? 1000 : -1000;
						break;
				}

				// score the cards in the meld
				for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++) {
					if (meld.cards[cardIndex].suit === 4)
						scores.cardsScore += 50;
					else
						scores.cardsScore += cardScores[meld.cards[cardIndex].number];
				}
			}

			// now score the cards left in players hands
			for (var playerIndex = 0; playerIndex < team.players.length; playerIndex++) {
				for (var handIndex = 0; handIndex < 2; handIndex++) {
					var cards = handIndex === 0 ? team.players[playerIndex].handCards : team.players[playerIndex].footCards;
					for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
						var card = cards[cardIndex];
						if (card.suit === 4)
							scores.cardsScore -= 50;
						else if (card.number === 2
						&& (card.suit === 1 || card.suit === 2))
							// red three
							scores.cardsScore -= 100;
						else
							scores.cardsScore -= cardScores[card.number];
					}
				}
			}

			scores.priorScore = team.score;
			team.score += scores.baseScore + scores.cardsScore;
		}

		var roundPlayed = {
			round: game.round,
			nsTeam: [
				{
					baseScore: results.nsTeam.baseScore,
					cardsScore: results.nsTeam.cardsScore,
					priorScore: results.nsTeam.priorScore
				}
			],
			ewTeam: [
				{
					baseScore: results.ewTeam.baseScore,
					cardsScore: results.ewTeam.cardsScore,
					priorScore: results.ewTeam.priorScore
				}
			]
		};
		game.roundsPlayed.push(roundPlayed);
		return results;
	}

	addStats(game, direction, youResigned, theyResigned, callback) {
		let results = game.buildStats(direction, youResigned, theyResigned);
		// update the person document
		Person.findById(results.personId, function(err, person) {
			if (err) {
				console.log(err.stack);
				console.log(results.personId);
				return callback(err);
			}
			if (!person) {
				console.log("can't find person");
				console.log(results.personId);
				return callback(new Error("can't find person"));
			}

			person.stats.push(results.stat);

			person.save(function(err) {
				if (err) {
					console.log('error saving person');
					console.log(err.stack);
					return callback(err);
				}

				callback(null);
			});
		});
	}

	// load the rounds played into results
	loadResults(roundsPlayed) {
		var results = {
			nsResults: [],
			ewResults: []
		};
		for (var roundIndex = 0; roundIndex < roundsPlayed.length; roundIndex++) {
			var nsTeam = {
				round: roundsPlayed[roundIndex].round,
				baseScore: roundsPlayed[roundIndex].nsTeam[0].baseScore,
				cardsScore: roundsPlayed[roundIndex].nsTeam[0].cardsScore,
				priorScore: roundsPlayed[roundIndex].nsTeam[0].priorScore,
				handScore: roundsPlayed[roundIndex].nsTeam[0].baseScore
					+ roundsPlayed[roundIndex].nsTeam[0].cardsScore,
				newScore: roundsPlayed[roundIndex].nsTeam[0].baseScore
					+ roundsPlayed[roundIndex].nsTeam[0].cardsScore
					+ roundsPlayed[roundIndex].nsTeam[0].priorScore
			};
			results.nsResults.push(nsTeam);
			var ewTeam = {
				round: roundsPlayed[roundIndex].round,
				baseScore: roundsPlayed[roundIndex].ewTeam[0].baseScore,
				cardsScore: roundsPlayed[roundIndex].ewTeam[0].cardsScore,
				priorScore: roundsPlayed[roundIndex].ewTeam[0].priorScore,
				handScore: roundsPlayed[roundIndex].ewTeam[0].baseScore
					+ roundsPlayed[roundIndex].ewTeam[0].cardsScore,
				newScore: roundsPlayed[roundIndex].ewTeam[0].baseScore
					+ roundsPlayed[roundIndex].ewTeam[0].cardsScore
					+ roundsPlayed[roundIndex].ewTeam[0].priorScore
			};
			results.ewResults.push(ewTeam);
		}
		return results;
	}

	// update players - record scores
	updatePlayers(game, personId, callback) {
		var nsResigned = false;
		var ewResigned = false;
		if (personId) {
			if (personId.toString() === game.players[0].person.id.toString()
			|| personId.toString() === game.players[2].person.id.toString())
				nsResigned = true;
			else
				ewResigned = true;
		}

		addStats(game, 'North', nsResigned, ewResigned, function(err) {
			if (err)
				return callback(err);
			addStats(game, 'South', nsResigned, ewResigned, function(err) {
				if (err)
					callback(err);
				addStats(game, 'East', ewResigned, nsResigned, function(err) {
					if (err)
						callback(err);
					addStats(game, 'West', ewResigned, nsResigned, function(err) {
						if (err)
							callback(err);

						callback(null);
					});
				});
			});
		});
	}

	mapToVM(game) {
		var _this = this;

		var gameVM = {
			_id: game.id,
			name: game.name,
			startDate: game.startDate,
			lastPlayedDate: game.lastPlayedDate,
			round: game.round,
			roundStartingPlayer: game.roundStartingPlayer,
			currentPlayer: game.currentPlayer,
			nsTeam: {
				score: game.team('North').score,
				melds: this.loadMelds(game.team('North').melds),
				counts: this.countMelds(game.team('North').melds)
			},
			ewTeam: {
				score: game.team('East').score,
				melds: this.loadMelds(game.team('East').melds),
				counts: this.countMelds(game.team('East').melds)
			},
			players: [],
			piles: [
				{ direction: 'North', cards: new CardPileVM.CardPileVM(game.pile('North').cards) },
				{ direction: 'East', cards: new CardPileVM.CardPileVM(game.pile('East').cards) },
				{ direction: 'South', cards: new CardPileVM.CardPileVM(game.pile('South').cards) },
				{ direction: 'West', cards: new CardPileVM.CardPileVM(game.pile('West').cards) },
				{ direction: 'Discard', cards: new CardPileVM.CardPileVM(game.pile('Discard').cards) }
			],
			gameBegun: game.gameBegun,
			turn: game.turn,
			turnState: game.turnState,
			drawCards: game.drawCards,
			gameComplete: game.gameComplete,
			results: this.loadResults(game.roundsPlayed)
		};

		if (gameVM.gameBegun) {
			// check to see if all the pick-up cards have been drawn - if so end the hand
			var pickupCardsLeft = gameVM.piles[0].cards.length +
				gameVM.piles[1].cards.length +
				gameVM.piles[2].cards.length +
				gameVM.piles[3].cards.length;
			if ((pickupCardsLeft < 2 && gameVM.turnState === 'draw2')
			|| (pickupCardsLeft < 1 && gameVM.turnState === 'draw1')) {
				// not enough cards to complete draw
				this.scoreTheGame(game, false);
				this.endTheHand(game);

				// save the game
				game.save(function(err, savedGame){
					if (err) {
						console.log('error saving game');
						console.log(err.stack);
						console.log(game);
						console.log(game.nsTeam);
						console.log(game.ewTeam);
						return reject(err);
					}
				});
			}
		}

		_this.loadPlayers(game, gameVM);

		return gameVM;
	};

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
						let gameVM = _this.mapToVM(game);

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
				// recreate the gameVM from the new DB game
				let gameVM = _this.mapToVM(game);

				resolve(gameVM);
			})
			.catch(err => reject(err));
		});
	}

	// no promise required as it does not return a message
	removePlayer(gameId, personId) {
		let _this = this;

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
			resolve(_this.mapToVM(game));
		})
		.catch(err => callback(err));
	}

	// update cards from message from a game
	updateGame(gameId, playerVM, pilesVM, meldsVM, action, control, callback) {
		var _this = this;
		// find game from DB
		gameUtil.loadGame(gameId)
		.then(game => {
			// get the player and team to be updated
			var player = false;
			var team = false;
			switch (playerVM.direction) {
				case 'North':
					player = game.nsTeam[0].players[0];
					team = game.nsTeam[0];
					break;
				case 'East':
					player = game.ewTeam[0].players[0];
					team = game.ewTeam[0];
					break;
				case 'South':
					player = game.nsTeam[0].players[1];
					team = game.nsTeam[0];
					break;
				case 'West':
					player = game.ewTeam[0].players[1];
					team = game.ewTeam[0];
					break;
			}

			// if the size of the hand or foot has changed then the other players will be notified
			var updatePlayers = false;
			if (player.handCards.length !== playerVM.handCards.length
			|| player.footCards.length !== playerVM.footCards.length)
				updatePlayers = true;

			// update the hand and foot
			player.handCards = playerVM.handCards.deserialize();
			player.footCards = playerVM.footCards.deserialize();

			// update the melds - again notify players if melds being updated
			updatePlayers = _this.unloadMelds(meldsVM, team.melds);

			// handle actions
			if (action) {
				updatePlayers = true;
				var cards = player.handCards.length === 0 ? player.footCards : player.handCards;

				if (action.action === "drawCard") {
					// draw a card
					if (action.pileIndex < 0 || action.pileIndex > 3) {
						console.log("PileIndex out of range attempting to draw a card");
						return callback(new Error("PileIndex out of range attempting to draw a card"));
					}

					// set the new turn state
					switch (control.turnState) {
						case 'draw1':
							control.turnState = 'draw2'
							break;
						case 'draw2':
							control.turnState = 'play'
							break;
						case 'draw3':
							if (--control.drawCards <= 0)
								control.turnState = 'play'
							break;
					}
					// draw the card
					cards.push(game.piles[action.pileIndex].cards.pop());
				} else if (action.action === "discardCard") {
					// discard the selected card
					if (action.cardIndex < 0 || action.cardIndex >= cards.length) {
						console.log("CardIndex out of range attempting to discard");
						return callback(new Error("CardIndex out of range attempting to discard"));
					}

					control.turnState = 'end';
					game.piles[4].cards.push(cards[action.cardIndex]);
					cards.splice(action.cardIndex, 1);
				} else if (action.action === "drawSevenCards") {
					// draw seven cards from the discard pile
					// the first card is already moved to the player
					game.piles[4].cards.pop();

					for (var cardIndex = 0; cardIndex < 6 && game.piles[4].cards.length > 0; cardIndex++) {
						cards.push(game.piles[4].cards.pop());
					}
				}
			}

			// update draw cards
			if (control.drawCards !== game.drawCards) {
				updatePlayers = true;
				game.drawCards = control.drawCards;
			}

			var results = false;
			// update the turn state
			if (control.turnState !== game.turnState) {
				updatePlayers = true;
				game.turnState = control.turnState;
				// if the hand has ended then perform end of hand routines
				switch (control.turnState) {
					case 'endHand':
						results = _this.scoreTheGame(game, team);
						_this.endTheHand(game);
						break;

					// if the current player's turn has ended then move on to the next player
					// endHand also falls through to here
					case 'end':
						if (++game.turn > 3)
							game.turn = 0;
						game.turnState = 'draw1';
				}
			}

			// save the game
			game.save(function(err, savedGame){
				if (err) {
					console.log('error saving game');
					console.log(err.stack);
					console.log(game);
					console.log(game.nsTeam);
					console.log(game.ewTeam);
					return callback(err);
				}

				// if the other players do not need to be notified then callback with no gameVM
				if (!updatePlayers)
					return callback(null, false);

				// recreate the gameVM from the new DB game
				_this.mapToVM(game, function(err, gameVM) {
					if (err) {
						console.log(err.stack);
						console.log(game);
						return callback(err);
					}

					// if the game is complete, update the stats
					if (game.gameComplete) {
						_this.updatePlayers(gameVM, false, function(err) {
							callback(null, gameVM, results);
						});
						return;
					}

					callback(null, gameVM, results);
				});
			});
		})
		.catch(err => callback(err));
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

				// recreate the gameVM from the new DB game
				var mapper = new GameVM();
				mapper.mapToVM(game, function(err, gameVM) {
					if (err) {
						console.log(err.stack);
						console.log(game);
						return callback(err);
					}

					_this.updatePlayers(gameVM, personId, function(err) {
						return callback(err, game);
					});
				});
			});
		})
		.catch(err => callback(err));
	};
}
