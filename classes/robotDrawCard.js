'use strict';

var robotCommon = require('./robotCommon');

module.exports = (function(pEventHandler) {
	var robotDrawCard = {
	};

	// draw a card
	robotDrawCard.drawACard = function(robot) {
		console.log('draw a card');
		var cards = robot.player.inFoot ? robot.player.footCards : robot.player.handCards;
		var drawOptions = canDrawFromPile(robot);
		if (drawOptions.length > 0) {
			var blackThrees = robotCommon.countSameCard(robot.discardPile, {suitNumber: 0, cardNumber: 1}, 7)
				+ robotCommon.countSameCard(robot.discardPile, {suitNumber: 3, cardNumber: 1}, 7);
			if (robot.player.inFoot || blackThrees < 3) {
				//return drawFromDiscard(robot);
			}
		}
		
		return this.drawFromPile(robot);
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
		if (robotCommon.isWildCard(topCard))
			return options;
		if (robotCommon.isBlackThree(topCard))
			return options;

		// does the card fit for a run
		var cards = [ false, false, false, false, false, false, false, false, false, false, false, false, false ];
		var cardsInRun = 0;
		// begin by looping through the hand for all the cards in the same suitNumber
		for (cardIndex = 0; cardIndex < hand.length; cardIndex++) {
			if (hand[cardIndex].suitNumber === topCard.suitNumber)
				cards[hand[cardIndex].cardNumber] = true;
		}
		
		// check for 2 cards lower than the top card
		if (topCard.cardNumber > 3 // the top card is a 6 or higher
		&& cards[topCard.cardNumber - 2] && cards[topCard.cardNumber - 1]
		&& robotCommon.countSameCard(hand, topCard) > 0)
			cardsInRun = robotCommon.countCardsInRun(cards, topCard);
		
		// check for 2 cards higher than the top card
		else if (topCard.cardNumber < 11 // the top card is a Q or lower
		&& cards[topCard.cardNumber + 2] && cards[topCard.cardNumber + 1]
		&& robotCommon.countSameCard(hand, topCard) > 0)
			cardsInRun = robotCommon.countCardsInRun(cards, topCard);
		
		// check for 1 card higher and 1 lower
		else if (topCard.cardNumber > 2 // the top card is a 5 or higher
		&& topCard.cardNumber < 12 // the top card is a K or lower
		&& cards[topCard.cardNumber - 1] && cards[topCard.cardNumber + 1]
		&& robotCommon.countSameCard(hand, topCard) > 0)
			cardsInRun = robotCommon.countCardsInRun(cards, topCard);
			
		if (!robot.player.inFoot && !robotCommon.oppenentsInFoot(robot))
			options.push('run');
		if ((robot.player.inFoot || robotCommon.oppenentsInFoot(robot)) && cardsInRun > 5)
			options.push('run');
		
		// count the card of cards of the same card in your hand
		var sameNumber = robotCommon.countSameCard(hand, topCard);

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
				if (robotCommon.isWildCard(discardPile.cards[cardIndex])) {
					pileLocked = true;
					break;
				}
			}
		}
			
		// okay if pile not locked and there is 1 + wild cards
		if (!pileLocked && robotCommon.countWildCards(hand) > 0)
			options.push('dirty');
		
		return options;
	}
	
	// draw a card from a draw pile
	robotDrawCard.drawFromPile = function(robot) {
		console.log('drawFromPile');
		var pileIndex;
		do {
			pileIndex = Math.floor(Math.random() * 4);
		} while (robot.drawPiles[pileIndex].cards === 0);
	
		return {action: 'drawCard', pileIndex: pileIndex};
	}
	
	return robotDrawCard;
})();