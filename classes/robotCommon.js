'use strict';

module.exports = (function(pEventHandler) {
	var robotCommon = {
	};

	// check for wild card
	robotCommon.isWildCard = function(card) {
		return card.suitNumber === 4 || card.cardNumber === 0;
	}
	
	// check for black three
	robotCommon.isBlackThree = function(card) {
		return (card.suitNumber === 0 || card.suitNumber === 3) && card.cardNumber === 1;
	}
	
	// count the number of cards that are the same as the passed card
	robotCommon.countSameCard = function(hand, matchingCard, depth) {
		var count = 0;
		var maxDepth = 0;
		if (depth && depth < hand.length)
			maxDepth = hand.length - depth;
			
		for (var cardIndex = hand.length - 1; cardIndex >= maxDepth; cardIndex--) {
			if (hand[cardIndex].cardNumber === matchingCard.cardNumber
			&& hand[cardIndex].suitNumber === matchingCard.suitNumber)
				count++;
		}
		return count;
	}
	
	// count the number of cards that are the same as the passed card cardNumber
	robotCommon.countSameNumber = function(hand, matchingCard, depth) {
		var count = 0;
		var maxDepth = 0;
		if (depth && depth < hand.length)
			maxDepth = hand.length - depth;
			
		for (var cardIndex = hand.length - 1; cardIndex >= maxDepth; cardIndex--) {
			if (hand[cardIndex].cardNumber === matchingCard.cardNumber)
				count++;
		}
		return count;
	}
			
	// count the number of wild cards
	robotCommon.countWildCards = function(cards) {
		var count = 0;
		for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
			if (isWildCard(cards[cardIndex]))
				count++;
		}
		return count;
	};
	
	// return true if any of the opponents are in their foot
	robotCommon.oppenentsInFoot = function(robot) {
		for (var playerIndex = 0; playerIndex < robot.otherPlayers.length; playerIndex++) {
			var player = robot.otherPlayers[playerIndex];
			if (player.teamIndex !== robot.teamIndex && player.handCards === 0)
				return true;
		}
		
		return false;
	}
	
	// return true if any of the opponents are on the table
	robotCommon.opponentsOnTable = function(robot) {
		for (var teamIndex = 0; teamIndex < robot.otherTeams.length; teamIndex++) {
			if (robot.otherTeams[teamIndex].melds.length > 0)
				return true;
		}
		
		return false;
	}
	
	// copy cards into a new array
	robotCommon.copyCards = function(inCards) {
		var outCards = [];
		for (var cardIndex = 0; cardIndex < inCards.length; cardIndex++) {
			outCards.push({
				cardNumber: inCards[cardIndex].cardNumber
				, suitNumber: inCards[cardIndex].suitNumber
			});
		}
		
		return outCards;
	}
	
	return robotCommon;
})();