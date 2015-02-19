'use strict';
var mongoose = require('mongoose');
var Person = mongoose.model('Person');
var gameIo = require('../classes/gameDL');

var GameVM = function() {
	var cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	var suitsCard = ['clubs', 'diams', 'hearts', 'spades', 'joker'];
	this.loadPlayer = function(player, teamIndex, people) {
		// build player
		var playerVM = {
			person: {},
			personOffset: player.personOffset,
			position: player.position,
			connected: player.connected,
			turn: false,
			inFoot: player.handCards.length === 0,
			teamIndex: teamIndex,
			footCards: this.loadCards(player.footCards),
			handCards: this.loadCards(player.handCards)
		};

		// add person if present
		if (player.personOffset !== -1) {
			playerVM.person = {
				id: people[player.personOffset]._id.toString(),
				name: people[player.personOffset].name
			};
		}
		
		return playerVM;
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
	this.countMelds = function(team) {
		var counts = [ 
			{type: 'Red Threes', count: team.redThrees, melds: ""},
			{type: 'Clean Melds', count: 0, melds: ""},
			{type: 'Dirty Melds', count: 0, melds: ""},
			{type: 'Runs', count: 0, melds: ""},
			{type: 'Wild Card Melds', count: 0}
		];
		
		for (var meldIndex = 0; meldIndex < team.melds.length; meldIndex++) {
			var meld = team.melds[meldIndex];
			if (!meld.isComplete)
				continue;

			switch (meld.type) {
				case "Clean Meld":
					counts[1].count++;
					counts[1].melds += counts[1].melds === "" ? cards[meld.number] : ", " + cards[meld.number];
					break;
				case "Dirty Meld":
					counts[2].count++;
					counts[2].melds += counts[2].melds === "" ? cards[meld.number] : ", " + cards[meld.number];
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
		var outPile = [];
		for (var cardIndex = 0; cardIndex < inPile.length; cardIndex++) {
			var card = inPile[cardIndex];
			var cardVM = {
				suitNumber: card.suit,
				cardNumber: card.number,
				suitCard: suitsCard[card.suit],
				number: card.number > -1 ? cards[card.number] : -1
			};
			outPile.push(cardVM);
		}

		return outPile;
	}

	// move card data from gameVM to game
	this.unloadCards = function(inPile) {
		var outPile = [];
		for (var cardIndex = 0; cardIndex < inPile.length; cardIndex++) {
			var card = inPile[cardIndex];
			outPile.push({
				suit: inPile[cardIndex].suitNumber,
				number: inPile[cardIndex].cardNumber
			});
		}

		return outPile;
	}

	// move meld data from gameVM to game
	this.unloadMelds = function(inMelds, team) {
		var updatePlayers = inMelds.length !== team.melds.length;

		// check for changes in melds
		for (var meldIndex = 0; meldIndex < inMelds.length && !updatePlayers; meldIndex++) {
			if (team.melds[meldIndex].isComplete !== inMelds[meldIndex].isComplete) {
				updatePlayers = true;
			} else if (team.melds[meldIndex].type !== inMelds[meldIndex].type) {
				updatePlayers = true;
			} else if (team.melds[meldIndex].number !== inMelds[meldIndex].number) {
				updatePlayers = true;
			} else if (team.melds[meldIndex].cards.length !== inMelds[meldIndex].cards.length)
				updatePlayers = true;
		}

		if (updatePlayers) {
			// if change then re-create the melds
			team.melds = [];
			
			for (var meldIndex = 0; meldIndex < inMelds.length; meldIndex++) {
				var inMeld = inMelds[meldIndex];
				var outMeld = {
					type: inMeld.type,
					number: inMeld.number,
					isComplete: inMeld.isComplete,
					cards: this.unloadCards(inMeld.cards)
				};
				team.melds.push(outMeld);
			}
		}
		
		return updatePlayers;
	}

	// score the game
	this.scoreTheGame = function(game, winningTeam) {
		var cardScores = [ 20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 20];
		
		for (var teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
			var team = game.teams[teamIndex];
			var scores = {
				round: game.round,
				baseScore: 0,
				cardsScore: 0,
				priorScore: 0
			}
			
			// add 100 points for going out first
			if (team == winningTeam)
				scores.baseScore += 100;
				
			// add/subtract 100 points for each red three
			if (team.melds.length === 0)
				scores.baseScore += team.redThrees * -100;
			else
				scores.baseScore += team.redThrees * 100;
			
			// score the team's melds
			for (var meldIndex = 0; meldIndex < team.melds.length; meldIndex++) {
				var meld = team.melds[meldIndex];
				switch (meld.type) {
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
			
			// now score the cards left in player's hand & foot
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

			team.results.push(scores);
		}
	}

	// deal a new hand
	this.dealNewHand = function(game) {
		var _this = this;
		var allCards = [];

		// create array of all cards
		for (var deckIndex = 0; deckIndex < 6; deckIndex++) {
			for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
				for (var cardIndex = 0; cardIndex < 13; cardIndex++) {
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
		for (var playerIndex = 0; playerIndex < game.numberOfPlayers; playerIndex++) {
			var player = _this.getPlayer(game, playerIndex);

			for (var handIndex = 0; handIndex < 2; handIndex++) {
				var hand = [];
				for (cardIndex = 0; cardIndex < 11; cardIndex++) {
					var cardPosition = Math.floor(Math.random() * allCards.length);
					hand.push(allCards[cardPosition]);
					allCards.splice(cardPosition, 1);
				}
				switch (handIndex) {
					case 0:
						player.handCards = hand;
						break;
					default:
						player.footCards = hand;
						break;
				}
			}
		}

		// load pickup and discard piles
		while (allCards.length > 0) {
			var cardIndex = Math.floor(Math.random() * allCards.length);
			var pileIndex = Math.floor(Math.random() * 4);
			game.drawPiles[pileIndex].cards.push(allCards[cardIndex]);
			allCards.splice(cardIndex, 1);
		}
	}

	// end the hand
	this.endTheHand = function(game) {
		for (var teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
			var team = games.teams[teamIndex];
			
			team.melds = [];
			
			for (var playerIndex = 0; playerIndex < team.players.length; playerIndex++) {
				var player = team.players[playerIndex];
				player.handCards = [];
				player.footCards = [];
			}
		}

		piles = [ {cards: [] },
			{cards: [] },
			{cards: [] },
			{cards: [] }
		];
		game.drawPiles = piles;
		game.discardPile = { cards: [] };
					
		// increment the round and end the game if the final round has been played
		if (++game.round > 6) {
			this.endTheGame(game);
			return;
		}
		
		// deal of the new hand
		this.dealNewHand(game);
		
		// set the next starting player
		if (++game.roundStartingPlayer > 3)
			game.roundStartingPlayer = 0;
		game.turn = game.roundStartingPlayer;
		game.turnState = 'draw1';
	}

	// end the game
	this.endTheGame = function(game) {
		game.gameComplete = true;
	}

	// add the stats from the game to each of the players
	function addStats(game, position, resignedTeam, winningTeam, callback) {
		// start building the score object
		var teamGame = this.getTeam(game, position);
		var status = 'loss';
		if (gameTeam == resignedTeam)
			status = 'resigned';
		else if (gameTeam == winningTeam)
			status = 'win';
		var score = {
			gameName: game.name
			, game.status: status
			, roundsPlayed: game.round
			, teams: []
		};
		
		var teamPosition = game.teams.indexOf(gameTeam);
		for (var teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
			var offsetTeam = teamIndex + teamPosition;
			if (offsetTeam >= game.teams.length)
				offsetTeam -= game.teams.length;
			var gameTeam = game.teams[offsetTeam];
			
			var team = {
				players: []
				, score: gameTeam.score
			}
		
			for (var playerIndex = 0; playerIndex < gameTeam.players.length; playerIndex++) {
				var gamePlayer = gameTeam.players[playerIndex];
				team.players.push({ name: gamePlayer.person.name });
			}
			
			score.teams.push(team);
		}
		
		// update the person document
		Person.findById(personId, function(err, person) {
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
			
			person.stats.push(stat);
			
			person.save(function(err) {
				if (err) {
					console.log('error saving person');
					console.log(err);
					return callback(err); 
				}
				
				callback(null);
			});
		});
	}
	
	// map results for a team
	this.loadResults = function(results) {
		var resultsVM = [];
		for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
			var result = results[resultIndex];
			var resultVM = {
				round: result.round,
				baseScore: result.baseScore,
				cardsScore: result.cardsScore,
				priorScore: result.priorScore,
				handScore: result.baseScore 
					+ result.cardsScore, 
				newScore: result.baseScore 
					+ result.cardsScore 
					+ result.priorScore
			};
			resultsVM.push(resultVM);
		}
		return resultsVM;
	}
	
	// update players - record scores
	this.updatePlayers = function(game, resignTeam, winningTeam, callback) {
		// update all the players
		var numberOfPlayers = game.numberOfPlayers;
		for (var playerIndex = 0; playerIndex < numberOfPlayers; playerIndex++) {
			addStats(game, playerIndex, resignedTeam, winningTeam, function(err) {
				if (err)
					return callback(err);

				if (--numberOfPlayers === 0)
					callback(null);
			});
		}
	}

	this.getPlayer = function(game, position) {
		// get the player from the position
		var noTeams = game.teams.length;
		var team = this.getTeam(game, position);
		return team.players[Math.floor(position / noTeams)];
	}

	this.getTeam = function(game, position) {
		// get the player from the position
		var noTeams = game.teams.length;
		return game.teams[position % noTeams];
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
		gameBegun: game.gameBegun,
		gameComplete: game.gameComplete,
		turn: game.turn,
		turnState: game.turnState,
		drawCards: game.drawCards,
		teams: [],
		players: [],
		drawPiles: [
			{ cards: this.loadCards(game.drawPiles[0].cards) },
			{ cards: this.loadCards(game.drawPiles[1].cards) },
			{ cards: this.loadCards(game.drawPiles[2].cards) },
			{ cards: this.loadCards(game.drawPiles[3].cards) },
		],
		discardPile: {
			cards: this.loadCards(game.discardPile.cards) 
		}
	};

	// build team
	for (var teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
		var team = game.teams[teamIndex];
		var teamVM = {
			score: team.score,
			redThrees: team.redThrees,
			melds: this.loadMelds(team.melds),
			counts: this.countMelds(team),
			results: this.loadResults(team.results)
		};
		gameVM.teams.push(teamVM);
	}
	
	// now do players
	var players = 0;
	for (var personIndex = 0; personIndex < game.numberOfPlayers; personIndex++) {
		var team = this.getTeam(game, personIndex);
		var teamIndex = game.teams.indexOf(team);
		var player = this.getPlayer(game, personIndex);

		var player = this.loadPlayer(player, teamIndex, game.people);
		gameVM.players.push(player);
		if (player.personOffset > -1)
			players++;
	}

	gameVM.playersFull = players === game.numberOfPlayers;
	
	return gameVM;
};

GameVM.prototype.getAllIncompleteGames = function(personId, callback) {
	var _this = this;
	gameIo.getIncompleteGames(function(err, games){
		if (err)
			return callback(err);

		var gamesVM = [];
		var ctr = games.length;
		for (var gameIndex = 0; gameIndex < games.length; gameIndex++) {
			var gameVM = _this.mapToVM(games[gameIndex]);

			gameVM.playerAttached = false;
			for (var playerIndex = 0; playerIndex < gameVM.players.length; playerIndex++) {
				if (gameVM.players[playerIndex].personOffset !== -1 
				&& gameVM.players[playerIndex].person.id === personId.toString()) {
					gameVM.playerAttached = true;
					break;
				}
			}
			
			// add game if it is still awaiting players
			if (!gameVM.playersFull || gameVM.playerAttached)
				gamesVM.push(gameVM);

			// when all games have been mapped to gameVM return the message to the front end
			if (--ctr === 0) {
				callback(null, gamesVM);
			}
		}
	});
};
	
GameVM.prototype.addPlayer = function(gameId, personId, position, callback) {
	var _this = this;
	gameIo.getGameById(gameId, function (err, game){
		if (err) 
			return callback(err);
		
		Person.findById(personId, function(err, person) {
			if (err) {
				console.log('cannot find person with id: ' + personId);
				console.log(err.stack);
				return callback(err);
			}
			if (!game) {
				console.log('cannot find person with id: ' + personId);
				return callback(new Error('cannot find person with id: ' + personId));
			}
			
			// add the player to the game
			var player = _this.getPlayer(game, position);
		
			// add person to the people collection
			if (player.personOffset === -1) {
				game.people.push(person);
				player.personOffset = game.people.length - 1;
			}

			player.connected = true;

			// if the game has enough players then begin the game
			if (game.people.length === game.numberOfPlayers && !game.gameBegun) {
				_this.dealNewHand(game);
				
				game.gameBegun = true;
				game.turn = Math.floor(Math.random() * 4);
				if (game.turn > 3)
					game.turn = 0;
				game.roundStartingPlayer = game.turn;
				game.turnState = "draw1";
			}

			// save the game
			gameIo.save(game, function(err, savedGame){
				if (err)
					return callback(err); 

				// recreate the gameVM from the new DB game
				var gameVM = _this.mapToVM(game);
				callback(null, gameVM);
			});
		});
	});
}

GameVM.prototype.removePlayer = function(gameId, personId, callback) {
	var _this = this;
	gameIo.getGameById(gameId, function (err, game){
		if (err) 
			return callback(err);
		
		// find the existing player
		var player = false;
		for (var playerIndex = 0; playerIndex < game.numberOfPlayers; playerIndex++) {
			var gamePlayer = _this.getPlayer(game, playerIndex);
			
			if (gamePlayer.personOffset > -1 && game.people[gamePlayer.personOffset]._id.toString() === personId.toString()) {
				player = gamePlayer;
				break;
			}
		}
		
		if (!player) {
			console.log('player not found in game');
			console.log(personId);
			return callback(new Error('player not found in game')); 
		}
		
		player.connected = false;
	
		// recreate the gameVM from the new DB game
		var gameVM = _this.mapToVM(game);
		
		// save the game
		gameIo.save(game, function(err, savedGame){
			if (err)
				return callback(err); 
			
			callback(null, gameVM);
		});
	});
}

// update cards from message from a game
GameVM.prototype.updateGame = function(
	gameId, 
	playerVM, 
	meldsVM, 
	redThrees, 
	action, 
	control, 
	callback
) {
	var _this = this;
	// find game from DB
	gameIo.getGameById(gameId, function (err, game){
		if (err) 
			return callback(err);

		// get the player and team to be updated
		var player = _this.getPlayer(game, playerVM.position);
		var team = _this.getTeam(game, playerVM.position);
		
		// if the size of the hand or foot has changed then the other players will be notified
		var updatePlayers = false;
		if (player.handCards.length !== playerVM.handCards.length
		|| player.footCards.length !== playerVM.footCards.length)
			updatePlayers = true;
			
		// update the hand and foot
		player.handCards = _this.unloadCards(playerVM.handCards);
		player.footCards = _this.unloadCards(playerVM.footCards);
		
		// update the melds - again notify players if melds being updated
		if (_this.unloadMelds(meldsVM, team))
			updatePlayers = true;
		
		if (redThrees !== team.redThrees) {
			updatePlayers = true;
			team.redThrees = redThrees;
		}
		
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
				cards.push(game.drawPiles[action.pileIndex].cards.pop());
			} else if (action.action === "discardCard") {
				// discard the selected card
				if (action.cardIndex < 0 || action.cardIndex >= cards.length) {
					console.log("CardIndex out of range attempting to discard");
					return callback(new Error("CardIndex out of range attempting to discard"));
				}

				control.turnState = 'end';
				game.discardPile.cards.push(cards[action.cardIndex]);
				cards.splice(action.cardIndex, 1);
			} else if (action.action === "drawSevenCards") {
				// draw seven cards from the discard pile
				// the first card is already moved to the player
				game.discardPile.cards.pop();
				
				for (var cardIndex = 0; cardIndex < 6 && game.discardPile.cards.length > 0; cardIndex++) {
					cards.push(game.discardPile.cards.pop());
				}
			}
		}
		
		// update draw cards
		if (control.drawCards !== game.drawCards) {
			updatePlayers = true;
			game.drawCards = control.drawCards;
		}

		var showResults = false;
		// update the turn state
		if (control.turnState !== game.turnState) {
			updatePlayers = true;
			game.turnState = control.turnState;
			// if the hand has ended then perform end of hand routines
			switch (control.turnState) {
				case 'endHand':
					_this.scoreTheGame(game, team);
					_this.endTheHand(game);
					showResults = true;
					break;
					
				// if the current player's turn has ended then move on to the next player
				// endHand also falls through to here
				case 'end':
					if (++game.turn > 3)
						game.turn = 0;
					game.turnState = 'draw1';
					break;
			}
		}
		
		// save the game
		gameIo.save(game, function(err, savedGame){
			if (err)
				return callback(err); 

			// if the other players do not need to be notified then callback with no gameVM
			if (!updatePlayers)
				return callback(null, false);
			
			// recreate the gameVM from the new DB game
			var gameVM = _this.mapToVM(game);
			
			// if the game is complete, update the stats
			var winningTeam = false;
			for (var teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
				var gameTeam = games.teams[teamIndex];
				if (gameTeam != resignedTeam) {
					if (!winningTeam)
						winningTeam = gameTeam;
					else if (winningTeam.score < gameTeam.score)
						winningTeam = gameTeam;
				}
			}
			if (game.gameComplete) {
				_this.updatePlayers(gameVM, false, winningTeam, function(err) {
					callback(null, gameVM, showResults);
				});
				return;
			}

			callback(null, gameVM, showResults);
		});
	});
};

// end the game
GameVM.prototype.endGame = function(gameId, resignTeam, winningTeam, callback) {
	var _this = this;
	// find game from DB
	gameIo.getGameById(gameId, function (err, game){
		if (err) 
			return callback(err);

		_this.scoreTheGame(game, null);
		_this.endTheGame(game);
		
		// save the game
		gameIo.save(game, function(err, savedGame){
			if (err)
				return callback(err); 

			// recreate the gameVM from the new DB game
			var gameVM = _this.mapToVM(game); 

			_this.updatePlayers(gameVM, resignTeam, winningTeam, function(err) {
				return callback(err, game);
			});
		});
	});
};

module.exports.GameVM = GameVM;