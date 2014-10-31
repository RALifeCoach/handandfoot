var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var Game = mongoose.model('Game');

var GameVM = function() {
	var suits = ['Club', 'Diamond', 'Heart', 'Spade', 'Joker'];
	var suitsCard = ['clubs', 'diams', 'hearts', 'spades', 'joker'];
	var cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
		
	this.loadPlayer = function(player, callback) {
		if (player.direction === '')
			return callback(null, false);

		var playerVM = {
				person: {
				id: player.person[0]
			},
			direction: player.direction,
			connected: player.connected,
			turn: false,
			footCards: this.loadCards(player.footCards),
			handCards: this.loadCards(player.handCards)
		};
		
		playerVM.inFoot = playerVM.handCards.length === 0;
		
		var query = Person.findById(player.person[0]);

		query.exec(function (err, person){
			if (err) { return callback(err); }
			if (!person) { return callback(new Error("can't find person")); }

			playerVM.person.name = person.name;

			callback(null, playerVM);
		});
	}

	// move melds from game to gameVM
	this.loadMelds = function(inMelds) {
		var outMelds = [];
		
		for (var meldIndex = 0; meldIndex < inMelds.length; meldIndex++) {
			outMelds.push( {
				type: inMelds[meldIndex].type,
				number: inMelds[meldIndex].number,
				isComplete: inMelds[meldIndex].isComplete,
				cards: this.loadCards(inMelds[meldIndex].cards)
			} );
		}
		
		return outMelds;
	}

	// count meld types
	this.countMelds = function(inMelds) {
		var counts = [ 
			{type: 'Red Threes', count: 0},
			{type: 'Clean Melds', count: 0},
			{type: 'Dirty Melds', count: 0},
			{type: 'Runs', count: 0},
			{type: 'Wild Card Melds', count: 0}
		];
		
		for (var meldIndex = 0; meldIndex < inMelds.length; meldIndex++) {
			var meld = inMelds[meldIndex];
			if (!meld.isComplete)
				continue;

			switch (meld.type) {
				case "Red Three":
					counts[0].count++;
					break;
				case "Clean Meld":
					counts[1].count++;
					break;
				case "Dirty Meld":
					counts[2].count++;
					break;
				case "Run":
					counts[3].count++;
					break;
				case "Wild Card Meld":
					counts[4].count++;
					break;
			}
		}
		
		return counts;
	}
	
	// move card data from game to gameVM
	this.loadCards = function(inPile) {
		try {
			var outPile = [];
			if (inPile.length > 0) {
				for (var cardIndex = 0; cardIndex < inPile.length; cardIndex++) {
					var card = inPile[cardIndex];
					cardVM = {
						suitNumber: card.suit,
						cardNumber: card.number,
						suit: suits[card.suit],
						suitCard: suitsCard[card.suit],
						number: card.number > -1 ? cards[card.number] : -1
					};
					outPile.push(cardVM);
				}
			}
		}
		catch (ex) {
			console.log(inPile);
			console.log(ex);
			throw ex;
		}

		return outPile;
	}

	// move card data from gameVM to game
	this.unloadCards = function(inPile, outPile) {
		var inCount = inPile.length;
		var outCount = outPile.length;
		var combinedCount = inCount < outCount ? inCount : outCount;
		
		// update cards for cards in both piles
		for (var cardIndex = 0; cardIndex < combinedCount; cardIndex++) {
			outPile[cardIndex].suit = inPile[cardIndex].suitNumber;
			outPile[cardIndex].number = inPile[cardIndex].cardNumber;
		}
		
		// if the in pile has more cards then add to out pile
		for (var cardIndex = combinedCount; cardIndex < inCount; cardIndex++) {
			outPile.push({
				suit: inPile[cardIndex].suitNumber,
				number: inPile[cardIndex].cardNumber
			});
		}
		
		// if the out pile has more cards then delete them
		if (outPile.length > combinedCount) {
			outPile.splice(combinedCount, outCount - combinedCount);
		}
	}

	// move meld data from gameVM to game
	this.unloadMelds = function(inMelds, outMelds) {
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

	// score the game
	this.scoreTheGame = function(game, winningTeam) {
		var cardScores = [ 20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 10];

		for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
			var team = teamIndex === 0 ? game.nsTeam[0] : game.ewTeam[0];
			
			var baseScore = 0;
			// add 100 points for going out first
			if (team == winningTeam)
				baseScore += 100;
				
			var cardsScore = 0;
			// score the team's melds
			for (var meldIndex = 0; meldIndex < team.melds.length; meldIndex++) {
				var meld = team.melds[meldIndex];
				switch (meld.type) {
					case 'Red Three':
						baseScore += 100;
						continue;
					case 'Clean Meld':
						baseScore += meld.isComplete ? 500 : 0;
						break;
					case 'Dirty Meld':
						baseScore += meld.isComplete ? 300 : 0;
						break;
					case 'run':
						baseScore += meld.isComplete ? 2000 : -2000;
						break;
					case 'Wild Card Meld':
						baseScore += meld.isComplete ? 1000 : -1000;
						break;
				}
				
				// score the cards in the meld
				for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++) {
					if (meld.cards[cardIndex].suit === 4)
						cardsScore += 50;
					else
						cardsScore += cardScores[meld.cards[cardIndex].number];
				}
			}
			
			// now score the cards left in players hands
			for (var playerIndex = 0; playerIndex < team.players.length; playerIndex++) {
				for (var handIndex = 0; handIndex < 2; handIndex++) {
					var cards = handIndex === 0 ? team.players[playerIndex].handCards : team.players[playerIndex].footCards;
					for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
						var card = cards[cardIndex];
						if (card.suit === 4)
							cardsScore -= 50;
						else if (card.number === 2
						&& (card.suit === 1 || card.suit === 2))
							// red three
							cardsScore -= 100;
						else
							cardsScore -= cardScores[card.number];
					}
				}
			}

			team.score += baseScore + cardsScore;
		}
	}

	// score the game
	this.dealNewHand = function(game) {
		var allCards = [];
		var deckIndex, cardIndex, suitIndex;
		var playerIndex, handIndex, cardPosition;
		var pileIndex;

		// create array of all cards
		for (deckIndex = 0; deckIndex < 6; deckIndex++) {
			for (suitIndex = 0; suitIndex < 4; suitIndex++) {
				for (cardIndex = 0; cardIndex < 13; cardIndex++) {
					allCards.push({ suit: suitIndex, 
						number: cardIndex });
				}
			}
			allCards.push({ suit: 4, 
				number: -1 });
			allCards.push({ suit: 4, 
				number: -1 });
		}

		// load players cards
		for (playerIndex = 0; playerIndex < 4; playerIndex++) {
			var cards;
			switch (playerIndex) {
				case 0: //north
					cards = game.nsTeam[0].players[0];
					break;
				case 1: //east
					cards = game.ewTeam[0].players[0];
					break;
				case 2: //south
					cards = game.nsTeam[0].players[1];
					break;
				case 3: //west
					cards = game.ewTeam[0].players[1];
					break;
			}

			for (handIndex = 0; handIndex < 2; handIndex++) {
				var hand = [];
				for (cardIndex = 0; cardIndex < 11; cardIndex++) {
					cardPosition = Math.floor(Math.random() * allCards.length);
					hand.push(allCards[cardPosition]);
					allCards.splice(cardPosition, 1);
				}
				switch (handIndex) {
					case 0:
						cards.handCards = hand;
						break;
					default:
						cards.footCards = hand;
						break;
				}
			}
		}

		// load pickup and discard piles
		var pileMax = Math.floor(allCards.length / 4);
		piles = [ {direction: 'North', cards: [] },
			{direction: 'East', cards: [] },
			{direction: 'South', cards: [] },
			{direction: 'West', cards: [] },
			{direction: 'Discard', cards: [] }
		];
		for (pileIndex = 0; pileIndex < 4; pileIndex++) {
			for (cardIndex = 0; cardIndex < pileMax; cardIndex++) {
				cardPosition = Math.floor(Math.random() * allCards.length);
				piles[pileIndex].cards.push(allCards[cardPosition]);
				allCards.splice(cardPosition, 1);
			}
		}
		game.piles = piles;
	}

	// end the hand
	this.endTheHand = function(game) {
		for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
			var team = teamIndex === 0 ? game.nsTeam[0] : game.ewTeam[0];
			
			team.melds = [];
			
			for (var playerIndex = 0; playerIndex < team.players.length; playerIndex++) {
				var player = team.players[playerIndex];
				player.handCards = [];
				player.footCards = [];
			}
		}

		piles = [ {direction: 'North', cards: [] },
			{direction: 'East', cards: [] },
			{direction: 'South', cards: [] },
			{direction: 'West', cards: [] },
			{direction: 'Discard', cards: [] }
		];
		game.piles = piles;
	}

	// end the game
	this.endTheGame = function(game) {
		game.gameComplete = true;
	}
};
	
GameVM.prototype.mapToVM = function(game, callback) {
	var gameVM = {
		_id: game._id,
		name: game.name,
		password: game.password,
		startDate: game.startDate,
		lastPlayedDate: game.lastPlayedDate,
		round: game.round,
		roundStartingPlayer: game.roundStartingPlayer,
		currentPlayer: game.currentPlayer,
		nsTeam: {
			score: game.nsTeam[0].score,
			melds: this.loadMelds(game.nsTeam[0].melds),
			counts: this.countMelds(game.nsTeam[0].melds)
		},
		ewTeam: {
			score: game.ewTeam[0].score,
			melds: this.loadMelds(game.ewTeam[0].melds),
			counts: this.countMelds(game.ewTeam[0].melds)
		},
		players: [],
		piles: [
			{ direction: 'North', cards: this.loadCards(game.piles[0].cards) },
			{ direction: 'East', cards: this.loadCards(game.piles[1].cards) },
			{ direction: 'South', cards: this.loadCards(game.piles[2].cards) },
			{ direction: 'West', cards: this.loadCards(game.piles[3].cards) },
			{ direction: 'Discard', cards: this.loadCards(game.piles[4].cards) }
		],
		gameBegun: game.gameBegun,
		turn: game.turn,
		turnState: game.turnState,
		drawCards: game.drawCards,
		gameComplete: game.gameComplete
	};

	var _this = this;

	_this.loadPlayer(game.nsTeam[0].players[0], function(err, player){
		if (err) return callback(err);
		gameVM.players.push(player);

		_this.loadPlayer(game.ewTeam[0].players[0], function(err, player){
			if (err) return callback(err);
			gameVM.players.push(player);

			_this.loadPlayer(game.nsTeam[0].players[1], function(err, player){
				if (err) return callback(err);
				gameVM.players.push(player);

				_this.loadPlayer(game.ewTeam[0].players[1], function(err, player){
					if (err) return callback(err);
					gameVM.players.push(player);

					var players = 0;
					for (var playerIndex = 0; playerIndex < gameVM.players.length; playerIndex++)
						if (gameVM.players[playerIndex])
							players++;
					gameVM.playersFull = players === 4;

					callback(null, gameVM);
				});
			});
		});
	});
};

GameVM.prototype.addPlayer = function(gameId, personId, direction, callback) {
	var query1 = Game.findById(gameId);
	query1.exec(function (err, game){
		if (err) {
			console.log(err);
			console.log(gameId);
			return callback(err); 
		}
		if (!game) { 
			console.log("can't find game");
			console.log(gameId);
			return callback(new Error("can't find game")); 
		}
		
		// create the new player
		var player = {};
		
		// add the player to the game
		switch (direction) {
			case 'North':
				player = game.nsTeam[0].players[0];
				break
			case 'South':
				player = game.nsTeam[0].players[1];
				break;
			case 'East':
				player = game.ewTeam[0].players[0];
				break
			case 'West':
				player = game.ewTeam[0].players[1];
				break;
		}
		player.direction = direction;
		player.connected = true;
		if (player.person.length === 0)
			player.person.push(personId);
	
		// save the game
		game.save(function(err, savedGame){
			if (err) { 
				console.log('error saving game');
				console.log(err);
				console.log(game);
				console.log(game.nsTeam);
				console.log(game.ewTeam);
				return callback(err); 
			}

			// recreate the gameVM from the new DB game
			var mapper = new GameVM();
			mapper.mapToVM(game, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(game);
					return callback(err); 
				}

				// get the person
				var query2 = Person.findById(personId);
				query2.exec(function (err, person){
					if (err) {
						console.log(err);
						console.log(personId);
						return callback(err); 
					}
					if (!person) { 
						console.log("can't find person");
						console.log(personId);
						return callback(new Error("can't find person")); 
					}

					// add the game to the person if not already there
					if (person.games.indexOf(gameId) > -1)
						return callback(null, gameVM);

					person.games.push(gameId);

					person.save(function(err, savedPerson) {
						if (err) { 
							console.log('error saving person');
							console.log(err);
							console.log(person);
							return callback(err); 
						}
						
						callback(null, gameVM);
					});
				});
			});
		});
	});
}

GameVM.prototype.removePlayer = function(gameId, personId, callback) {
	var query1 = Game.findById(gameId);
	query1.exec(function (err, game){
		if (err) {
			console.log(err);
			console.log(gameId);
			return callback(err); 
		}
		if (!game) { 
			console.log("can't find game");
			console.log(gameId);
			return callback(new Error("can't find game")); 
		}
		
		// create the existing player
		var player = false;
		if (game.nsTeam[0].players[0].direction !== '' && game.nsTeam[0].players[0].person[0].toString() === personId.toString())
			player = game.nsTeam[0].players[0];
		else if (game.nsTeam[0].players[1].direction !== '' && game.nsTeam[0].players[1].person[0].toString() === personId.toString())
			player = game.nsTeam[0].players[1];
		else if (game.ewTeam[0].players[0].direction !== '' && game.ewTeam[0].players[0].person[0].toString() === personId.toString())
			player = game.ewTeam[0].players[0];
		else if (game.ewTeam[0].players[1].direction !== '' && game.ewTeam[0].players[1].person[0].toString() === personId.toString())
			player = game.ewTeam[0].players[1];
		
		if (!player) {
			console.log('player not found in game');
			console.log(personId);
			console.log(game.nsTeam[0].players);
			console.log(game.ewTeam[0].players);
			return callback(new Error('player not found in game')); 
		}
		
		player.connected = false;
	
		// save the game
		game.save(function(err, savedGame){
			if (err) { 
				console.log('error saving game');
				console.log(err);
				console.log(game);
				console.log(game.nsTeam);
				console.log(game.ewTeam);
				return callback(err); 
			}

			// recreate the gameVM from the new DB game
			var mapper = new GameVM();
			mapper.mapToVM(game, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(game);
					return callback(err); 
				}

				// get the person
				var query2 = Person.findById(personId);
				query2.exec(function (err, person){
					if (err) {
						console.log(err);
						console.log(personId);
						return callback(err); 
					}
					if (!person) { 
						console.log("can't find person");
						console.log(personId);
						return callback(new Error("can't find person")); 
					}

					// remove the game from the person
					for (var gameIndex = 0; gameIndex < person.games.length; gameIndex++) {
						if (person.games[gameIndex] === gameId) {
							person.games.splice(gameIndex, 1);
							break;
						}
					}

					// save the changed person
					person.save(function(err, savedPerson) {
						if (err) { 
							console.log('error saving person');
							console.log(err);
							console.log(person);
							return callback(err); 
						}
						
						callback(null, gameVM);
					});
				});
			});
		});
	});
}

GameVM.prototype.startNewGame = function(gameId, callback) {
	var _this = this;
	// find game from DB
	var query1 = Game.findById(gameId);
	query1.exec(function (err, game){
		if (err) {
			console.log(err);
			console.log(gameId);
			return callback(err); 
		}
		if (!game) { 
			console.log("can't find game");
			console.log(gameId);
			return callback(new Error("can't find game")); 
		}
		
		_this.dealNewHand(game);
		
		game.gameBegun = true;
		game.turn = Math.floor(Math.random() * 4);
		if (game.turn > 3)
			game.turn = 0;
		game.turnState = "draw1";
		
		// save the game
		game.save(function(err, savedGame){
			if (err) { 
				console.log('error saving game');
				console.log(err);
				console.log(game);
				console.log(game.nsTeam);
				console.log(game.ewTeam);
				return callback(err); 
			}

			// recreate the gameVM from the new DB game
			var mapper = new GameVM();
			mapper.mapToVM(game, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(game);
					return callback(err); 
				}
				
				callback(null, gameVM);
			});
		});
	});
}

// update cards from message from a game
GameVM.prototype.updateGame = function(gameId, playerVM, pilesVM, meldsVM, control, callback) {
	var _this = this;
	// find game from DB
	var query1 = Game.findById(gameId);
	query1.exec(function (err, game){
		if (err) {
			console.log(err);
			console.log(gameId);
			return callback(err); 
		}
		if (!game) { 
			console.log("can't find game");
			console.log(gameId);
			return callback(new Error("can't find game")); 
		}

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
		_this.unloadCards(playerVM.handCards, player.handCards);
		_this.unloadCards(playerVM.footCards, player.footCards);
		
		// update the 5 piles - again notify players if piles being updated
		for (var pileIndex = 0; pileIndex < pilesVM.length; pileIndex++) {
			if (pilesVM[pileIndex].cards.length !== game.piles[pileIndex].cards) {
				_this.unloadCards(pilesVM[pileIndex].cards, game.piles[pileIndex].cards);
				updatePlayers = true;
			}
		}
		
		// update the melds - again notify players if melds being updated
		updatePlayers = _this.unloadMelds(meldsVM, team.melds);
		
		// update draw cards
		if (control.drawCards !== game.drawCards) {
			updatePlayers = true;
			game.drawCards = control.drawCards;
		}
		
		// update the turn state
		if (control.turnState !== game.turnState) {
			updatePlayers = true;
			game.turnState = control.turnState;
			// if the hand has ended then perform end of hand routines
			switch (control.turnState) {
				case 'endHand':
					_this.scoreTheGame(game, team);
					_this.endTheHand(game);
					
					// increment the round and end the game if the final round has been played
					if (++game.round > 6) {
						_this.endTheGame(game);
						break;
					}
					
					// deal of the new hand
					_this.dealNewHand(game);
					
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
				console.log(err);
				console.log(game);
				console.log(game.nsTeam);
				console.log(game.ewTeam);
				return callback(err); 
			}

			// if the other players do not need to be notified then callback with no gameVM
			if (!updatePlayers)
				return callback(null, false);
			
			// recreate the gameVM from the new DB game
			var mapper = new GameVM();
			mapper.mapToVM(game, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(game);
					return callback(err); 
				}
				
				callback(null, gameVM);
			});
		});
	});
};

module.exports.GameVM = GameVM;