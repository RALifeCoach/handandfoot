'use strict';

var mongoose = require('mongoose');
var Robot = mongoose.model('Robot');

module.exports = function(gameId, position, pEventHandler) {
	var id = gameId + 'p' + position;
	var eventHandler = pEventHandler;
	var robotPlayer = {
	};
	
	robotPlayer.emit = function(messageType, data) {
		Robot.findById(id, function(err, robot) {
			if (err) {
				console.log('error fetching robot: ' + id);
				console.log(err);
				return;
			}
			// process the message
			switch (messageType) {
				case 'gameUpdate':
					gameUpdate(data, robot, id);
					break;
				case 'chatUpdate':
					chatUpdate(data, robot);
					break;
				case 'endHandQuestion':
					endHandQuestion(robot);
					break;
				case 'endHandResponse':
					endHandResponse(data, robot);
					break;
				case 'resignRequest':
					resignRequest(robot);
					break;
				case 'resignResponse':
					resignResponse(data, robot);
					break;
				default:
					ggggg = ooooo;
			}
		});
	};
	
	return robotPlayer;
	
	function gameUpdate(data, robot, id) {
		console.log('robot game update');
		
		// update robot information - if it doesn't exist then create it
		if (!robot) {
			robot = new Robot({
				_id: id
				, player: {}
				, control: {}
				, gameMessages: []
			});
		}
		
		// load 'my' values
		robot.player.position = data.players[0].position;
		robot.player.handCards = loadCards(data.players[0].footCards);
		robot.player.footCards = loadCards(data.players[0].handCards);
		robot.player.inFoot = data.players[0].handCards.length === 0;
		robot.melds = data.teams[0].melds;
		robot.score = data.teams[0].score;
		robot.redThrees = data.teams[0].redThrees;
		robot.control.round = data.game.round;
		robot.control.turn = data.players[0].turn;
		robot.control.turnState = data.game.turnState;
		robot.control.drawCards = data.game.drawCards;
		robot.otherPlayers = [];
		robot.otherTeams = [];
		robot.discardPile = {
			cards: loadCards(data.game.discardPile.cards)
		};
		robot.drawPiles = data.game.drawPiles;
		
		var teamCount = data.teams.length;
		var teamIndex = data.players[0].teamIndex;
		for (var playerIndex = 1; playerIndex < data.players.length; playerIndex++) {
			var player = data.players[playerIndex];
			var playerTeamIndex = player.teamIndex - teamIndex;
			if (playerTeamIndex < 0)
				playerTeamIndex += teamCount; 
			robot.otherPlayers.push({
				turn: player.turn,
				teamIndex: playerTeamIndex,
				position: player.position,
				handCards: player.handCards,
				footCards: player.footCards
			});
		}
		for (var teamIndex = 1; teamIndex < data.teams.length; teamIndex++) {
			var team = data.teams[teamIndex];
			robot.otherTeams.push({
				melds: team.melds,
				redThrees: team.redThrees,
				score: team.score
			});
		}
		
		robot.save(function(err) {
			if (err) {
				console.log('error inserting robot');
				console.log(robot);
				console.log(err.stack);
				return;
			}
			
			// if it's the robot's turn then play
			if (robot.control.turn && data.game.gameBegun)
				playTurn(robot);
		});
	}
	
	// load the cards
	function loadCards(inCards) {
		var outCards = [];
		for (var cardIndex = 0; cardIndex < inCards.length; cardIndex++) {
			outCards.push({
				card: inCards[cardIndex].cardNumber
				, suit: inCards[cardIndex].suitNumber
			});
		}
		
		return outCards;
	}
	
	// it's the robot's turn
	function playTurn(robot) {
		console.log('play turn', robot.control.turnState);
		switch (robot.control.turnState) {
			case 'draw1':
				drawACard(robot);
				break;
			case 'draw2':
			case 'draw3':
				drawFromPile(robot);
				break;
			case 'play':
				playCards(robot);
				break;
		}
	}

	// draw a card
	function drawACard(robot) {
		console.log('draw a card');
		var cards = robot.player.inFoot ? robot.player.footCards : robot.player.handCards;
		var drawOptions = canDrawFromPile(robot);
		if (drawOptions.length > 0) {
			var blackThrees = countSameCard(robot.discardPile, {suit: 0, number: 1}, 7)
				+ countSameCard(robot.discardPile, {suit: 3, number: 1}, 7);
			if (robot.player.inFoot || blackThrees < 3) {
				//return drawFromDiscard(robot);
			}
		}
		
		drawFromPile(robot);
	}
	
	// check to see if the robot can draw a card
	function canDrawFromPile(robot) {
		var options = [];
		// check to see if the player is allowed to draw from discard pile
		var discardPile = robot.discardPile;
		var hand = robot.player.inFoot ? robot.player.footCards : robot.player.handCards;
		
		// are there cards on the discard pile?
		if (discardPile.cards.length === 0)
			return options;
			
		// cannot draw if the top card is a wild card or black 3
		var topCard = discardPile.cards[robot.discardPile.cards.length - 1];
		if (isWildCard(topCard))
			return options;
		if (isBlackThree(topCard))
			return options;

		// does the card fit for a run
		var cards = [ false, false, false, false, false, false, false, false, false, false, false, false, false ];
		var cardsInRun = 0;
		// begin by looping through the hand for all the cards in the same suit
		for (cardIndex = 0; cardIndex < hand.length; cardIndex++) {
			if (hand[cardIndex].suitNumber === topCard.suitNumber)
				cards[hand[cardIndex].cardNumber] = true;
		}
		
		// check for 2 cards lower than the top card
		if (topCard.cardNumber > 3 // the top card is a 6 or higher
		&& cards[topCard.cardNumber - 2] && cards[topCard.cardNumber - 1]
		&& !containsCard(hand, topCard))
			cardsInRun = countCardsInRun(cards, topCard);
		
		// check for 2 cards higher than the top card
		else if (topCard.cardNumber < 11 // the top card is a Q or lower
		&& cards[topCard.cardNumber + 2] && cards[topCard.cardNumber + 1]
		&& !containsCard(hand, topCard))
			cardsInRun = countCardsInRun(cards, topCard);
		
		// check for 1 card higher and 1 lower
		else if (topCard.cardNumber > 2 // the top card is a 5 or higher
		&& topCard.cardNumber < 12 // the top card is a K or lower
		&& cards[topCard.cardNumber - 1] && cards[topCard.cardNumber + 1]
		&& !containsCard(hand, topCard))
			cardsInRun = countCardsInRun(cards, topCard);
			
		if (!robot.player.inFoot && !oppenentsInFoot(robot))
			options.push('run');
		if ((robot.player.inFoot || oppenentsInFoot(robot)) && cardsInRun > 5)
			options.push('run');
		
		// count the number of cards of the same number in your hand
		var sameNumber = countSameCard(hand, topCard);

		if (sameNumber === 0)
			return options;
		
		// okay if there are 2 or more
		if (sameNumber > 1) {
			options.push('clean');
			return options;
		}
			
		// pile locked if your team has no melds or there is a wildcard in the discard pile
		var pileLocked = robot.melds.length === 0;
		if (!pileLocked) {
			for (var cardIndex = 0; cardIndex < discardPile.cards.length; cardIndex++) {
				if (isWildCard(discardPile.cards[cardIndex])) {
					pileLocked = true;
					break;
				}
			}
		}
			
		// okay if pile not locked and there is 1 + wild cards
		if (!pileLocked && countWildCards(hand) > 0)
			options.push('dirty');
		
		return options;
	}
	
	// check for wild card
	function isWildCard(card) {
		return card.suitNumber === 4 || card.cardNumber === 0;
	}
	
	// check for black three
	function isBlackThree(card) {
		return (card.suitNumber === 0 || card.suitNumber === 3) && card.cardNumber === 1;
	}
	
	// count the number of cards that are the same as the passed card
	function countSameCard(hand, matchingCard, depth) {
		var count = 0;
		var maxDepth = 0;
		if (depth && depth < hand.length)
			maxDepth = hand.length - depth;
			
		for (var cardIndex = hand.length - 1; cardIndex >= maxDepth; cardIndex--) {
			if (hand[cardIndex].number === matchingCard.number
			&& hand[cardIndex].suit === matchingCard.suit)
				count++;
		}
		return count;
	}
	
	// count the number of cards that are the same as the passed card number
	function countSameNumber(hand, matchingCard, depth) {
		var count = 0;
		var maxDepth = 0;
		if (depth && depth < hand.length)
			maxDepth = hand.length - depth;
			
		for (var cardIndex = hand.length - 1; cardIndex >= maxDepth; cardIndex--) {
			if (hand[cardIndex].number === matchingCard.number)
				count++;
		}
		return count;
	}
			
	// count the number of wild cards
	countWildCards = function(cards) {
		var count = 0;
		for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
			if (isWildCard(cards[cardIndex]))
				count++;
		}
		return count;
	};
	
	// return true if any of the opponents are in their foot
	function oppenentsInFoot(robot) {
		for (var playerIndex = 0; playerIndex < robot.otherPlayers.length; playerIndex++) {
			var player = robot.otherPlayers[playerIndex];
			if (player.teamIndex !== robot.teamIndex && player.handCards === 0)
				return true;
		}
		
		return false;
	}
	
	
	// draw a card from a draw pile
	function drawFromPile(robot) {
		console.log('drawFromPile');
		var pileIndex;
		do {
			pileIndex = Math.floor(Math.random() * 4);
		} while (robot.drawPiles[pileIndex].cards === 0);
	
		sendUpdate(robot, {action: 'drawCard', pileIndex: pileIndex});
	}

	// send an update to the server
	function sendUpdate(robot, action) {
		if (!action)
			action = false;
			
		var data = {
			id: robot._id,
			player: robot.player,
			melds: robot.melds,
			redThrees: robot.redThrees,
			action: action,
			control: robot.control
		};

		eventHandler.emit('updateGame', data);
		
		for (var messageIndex = 0; messageIndex < robot.gameMessages.length; messageIndex++)
			eventHandler.emit('gameMessage', { message: robot.gameMessages[messageIndex] });
		robot.gameMessages = [];
	};
	
	// received chat
	function chatUpdate(data, robot) {
		console.log('robot chat update');
console.log(data);
	}
};