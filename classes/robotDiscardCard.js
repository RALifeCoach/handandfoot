'use strict';

module.exports = (function(pEventHandler) {
	var robotDiscardCard = {
	};

	// draw a card
	robotDiscardCard.discardCard = function(robot) {
		console.log('discard a card');
		
		// temp
		var hand = robot.player.inFoot ? robot.player.footCards : robot.player.handCards;
		var cardIndex = Math.floor(Math.random() * hand.length);
		return { action: 'discardCard', cardIndex: cardIndex };
	}
	
	return robotDiscardCard;
})();