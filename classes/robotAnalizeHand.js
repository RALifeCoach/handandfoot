'use strict';

var robotCommon = require('./robotCommon');

module.exports = (function(pEventHandler) {
	var robotAnalizeHand = {
	};

	// draw a card
	robotAnalizeHand.analizeHand = function(robot) {
		console.log('analize hand');

		// initialize counters and arrays
		robot.hand.redThrees = [];
		robot.hand.blackThrees = []
		robot.hand.wildCards = { existingLength: 0, twos: 0, jokers: 0, cards: [] };
		robot.hand.melds = [
			{ meldCount: 0, wildCardCount: 0, cards: [] } // 4
			, { meldCount: 0, wildCardCount: 0, cards: [] } // 5
			, { meldCount: 0, wildCardCount: 0, cards: [] } // 6
			, { meldCount: 0, wildCardCount: 0, cards: [] } // 7
			, { meldCount: 0, wildCardCount: 0, cards: [] } // 8
			, { meldCount: 0, wildCardCount: 0, cards: [] } // 9
			, { meldCount: 0, wildCardCount: 0, cards: [] } // 10
			, { meldCount: 0, wildCardCount: 0, cards: [] } // J
			, { meldCount: 0, wildCardCount: 0, cards: [] } // Q
			, { meldCount: 0, wildCardCount: 0, cards: [] } // K
			, { meldCount: 0, wildCardCount: 0, cards: [] } // A
		];
		robot.hand.runs = [
			{ existing: []
				, runOffset: -1
				, runLength: 0
				, playableOffset: -1
				, playableLength: 0
				, cards: [false, false, false, false, false, false, false, false, false, false, false] } // clubs
			, { existing: []
				, runOffset: -1
				, runLength: 0
				, playableOffset: -1
				, playableLength: 0
				, cards: [false, false, false, false, false, false, false, false, false, false, false] } // diamonds
			, { existing: []
				, runOffset: -1
				, runLength: 0
				, playableOffset: -1
				, playableLength: 0
				, cards: [false, false, false, false, false, false, false, false, false, false, false] } // hearts
			, { existing: []
				, runOffset: -1
				, runLength: 0
				, playableOffset: -1
				, playableLength: 0
				, cards: [false, false, false, false, false, false, false, false, false, false, false] } // spades
		];
		robot.hand.unusedCards = [];
		
		var hasExistingRuns = false;
		var hand = robot.player.inFoot 
			? robotCommon.copyCards(robot.player.footCards)
			: robotCommon.copyCards(robot.player.handCards);

		// load incomplete meld data
		this.loadIncompleteMeldData(robot);
		
		// check for possible add ons to runs and remove the cards from further analysis
		this.runsAddons(robot, hand);
		
		// organize the cards
		this.organizeCards(robot, hand);

		// check for possible new runs
		var longestRun = this.possibleNewRuns(robot, hand);
		
		// clean up melds and runs
		this.cleanupRunCards(robot, hand, longestRun);
		
		// eliminate melds with < 2 cards or cards that take meld length 8 or 9
		this.cleanupMelds(robot, hand);
		
		robot.hand.unusedCards = hand;
		
		// score possible playable cards if no melds
		if (robot.melds.length > 0)
			return;

		this.scoreRuns(robot);

		// find maximum possible score to go on the table
		var opponentsOnTable = robotCommon.opponentsOnTable(robot);
		var minExcludeMeld = 2;
		var maxExcludeMeld = 9;
		if (opponentsOnTable) {
			minExcludeMeld = 4;
			maxExcludeMeld = 7;
		}
		
		// 1. max wild card run, if possible
		var score1 = 0;
		var jokerCount = robot.hand.wildCards.jokers;
		var twoCount = robot.hand.wildCards.twos;
		if (jokerCount + twoCount > 2) {
			if (jokerCount > 7) {
				score1 += 7 * 50;
				jokerCount -= 7;
			} else {
				score += jokerCount * 50;
				if (jokerCount + twoCount > 7) {
					score1 += (7 - jokerCount) * 20;
					twoCount -= (7 - jokerCount);
				} else {
					score1 += twoCount * 20;
					twoCount = 0;
				}
				jokerCount = 0;
			}
		}
		// now add in melds
		for (var meldIndex = 0; meldIndex < 11; meldIndex++) {
			var meld = robot.melds[meldIndex];
			if (meld.cards.length >= 7) {
			}
		}
	};

	// these could be local, but make public for testing
	robotAnalizeHand.loadIncompleteMeldData = function(robot) {
		// load incomplete meld data
		for (var meldIndex = 0; meldIndex < robot.melds.length; meldIndex++) {
			var meld = robot.melds[meldIndex];
			if (meld.type === 'Run')
				hasExistingRuns = true;
			
			if (!meld.complete) {
				switch (meld.type) {
					case 'Wild Card Meld':
						robot.hand.wildCards.existingLength = meld.cards.length;
						break;
					case 'Run':
						var start = 99;
						var suitIndex = -1;
						for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++) {
							var card = meld.cards[cardIndex];
							suitIndex = card.suitNumber;
							if (card.cardNumber < start)
								start = card.cardNumber;
						}
						start -= 2;
						robot.hand.runs[suitIndex].existing.push({
							start: start
							, length: meld.cards.length
							, cards: [false, false, false, false, false, false, false, false, false, false, false]
						});
						break;
					case 'Dirty Meld':
						for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++) {
							var card = meld.cards[cardIndex];
							if (robotComon.isWildCard(card))
								robot.hand.melds[meld.number - 2].wildCardCount++;
						}
					case 'Clean Meld':
						robot.hand.melds[meld.number - 2].meldCount = meld.cards.length;
						break;
				}
			}
		}
	};
	
	robotAnalizeHand.runAddons = function(robot, hand) {
		// check for possible add ons to runs and remove the cards from further analysis
		for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
			var suit = robot.hand.runs[suitIndex];
			for (var runIndex = 0; runIndex < suit.existing.length; runIndex++) {
				var run = suit.existing[runIndex];
				var lowest = run.start - 7 + run.length;
				if (lowest < 0) {
					lowest = 0;
					if (lowest === start)
						lowest--;
				}
				var highest = run.start + 7;
				if (highest > 11) {
					highest = 11;
					if (highest === start + 7)
						highest++;
				}
				
				var usedCards = [];
				for (var cardIndex = 0; hand.length; cardIndex++) {
					var card = hand[cardIndex];
					if (robotCommon.isWildCard(card))
						continue;
					if (robotCommon.isRedThree(card))
						continue;
					if (robotCommon.isBlackThree(card))
						continue;
					var cardNumber = card.cardNumber - 2;
					if (cardNumber >= lowest
					&& cardNumber < start
					&& !existing.cards[cardNumber]) {
						existing.cards[cardNumber] = [];
						existing.cards[cardNumber].push(card);
						usedCards.push(card);
					}
					else if (cardNumber >= highest
					&& cardNumber > start + 7
					&& !existing.cards[cardNumber]) {
						existing.cards[cardNumber] = [];
						existing.cards[cardNumber].push(card);
						usedCards.push(card);
					}
				}
				
				this.removeUsedCards(hand, usedCards);
			}
		}
	};

	robotAnalizeHand.organizeCards = function(robot, hand) {
		// organize the cards
		var usedCards = [];
		for (var cardIndex = 0; cardIndex < hand.length; cardIndex++) {
			var card = hand[cardIndex];
			if (robotCommon.isRedThree(card)) {
				robot.hand.redThrees.push(card);
				usedCards.push(card);
			} else if (robotCommon.isBlackThree(card)) {
				robot.hand.blackThrees.push(card);
				usedCards.push(card);
			} else if (robotCommon.isWildCard(card)) {
				robot.hand.wildCards.push(card);
				usedCards.push(card);
				if (card.cardNumber === 0) {
					robot.hand.wildCards.score += 20;
					robot.hand.wildCards.twos++;
				} else {
					robot.hand.wildCards.score += 50;
					robot.hand.wildCards.jokers++;
				}
			} else {
				robot.hand.melds[card.cardNumber - 2].cards.push(card);
				if (!robot.hand.runs[card.suitNumber].cards[card.cardNumber - 2]) {
					robot.hand.runs[card.suitNumber].cards[card.cardNumber - 2] = [];
					robot.hand.runs[card.suitNumber].cards[card.cardNumber - 2].push(card);
				}
			}
		}

		this.removeUsedCards(hand, usedCards);
	};

	robotAnalizeHand.possibleNewRuns = function(robot, hand) {
		// check for possible new runs
		var longestRun = 0;
		var opponentsInFoot = robotCommon.opponentsInFoot(robot);
		for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
			var suit = robot.hand.runs[suitIndex];
			var minRunLength = 3;
			if (opponentsInFoot)
				minRunLength = 6;
			else if (hasExistingRuns)
				minRunLength = 5;
			else if (suit.existing.length === 0)
				minRunLength = 3;
			else if (suit.exististing.length === 1)
				minRunLength = 5;
			else if (suit.exististing.length > 1)
				minRunLength = 7;
			
			suit.runLength = 0;
			suit.runOffset = -1;
			// loop through the possible starting cards (4-8)
			for (var offsetIndex = 0; offsetIndex < 5; offetIndex++) {
				var runLength = 0;
				for (var cardIndex = 0; cardIndex < 7; cardIndex++) {
					if (suit.cards[offsetIndex + cardIndex])
						runLength++;
				}
				if (runLength >= minRunLength && runLength > suit.runLength) {
					suit.runLength = runLength;
					suit.runOffset = offsetIndex;
					if (runLength > longestRun)
						longestRun = runLength;
				}
			}
		}
		
		return longestRun;
	};

	robotAnalizeHand.cleanupRunCards = function(robot, hand, longestRun) {
		// clean up melds and runs
		// add cards allocated to runs in usedCards
		var usedCards = [];
		var deleteRunIfLessThan = longestRun - 2;
		for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
			var suit = robot.hand.runs[suitIndex];
			if (suit.runLength > 0) {
				if (suit.runLength < deleteRunIfLessThan) {
					// delete the possible run
					suit.runLength = 0;
					for (var cardIndex = 0; cardIndex < 11; cardIndex++) {
						suit.cards[cardIndex] = false;
					}
				} else {
					for (var cardIndex = 0; cardIndex < 11; cardIndex++) {
						if (cardIndex < suit.runOffset
						|| cardIndex > suit.runOffset + 7)
							suit.cards[cardIndex] = false;
						else if (suit.cards[cardIndex]) {
							var card = suit.cards[cardIndex][0];
							var cardPosition = robot.hand.melds[cardIndex].indexOf(card);
							if (cardPosition > -1)
								robot.hand.melds[cardIndex].splice(cardPosition, 1);
							usedCards.push(card);
						}
					}
				}
			}
		}

		this.removeUsedCards(hand, usedCards);
	};

	robotAnalizeHand.cleanupMelds = function(robot, hand) {
		var usedCards = [];
		// eliminate melds with < 2 cards or cards that take meld length 8 or 9
		// add remaining cards to usedCards
		for (var meldIndex = 0; meldIndex < 11; meldIndex++) {
			var meld = robot.hand.melds[meldIndex];
			if (meld.cards < 2)
				meld.cards = false;
			var meldLength = meld.existing.cards.length + meld.cards.length;
			if (meldLength === 8 || meldLength === 9)
				meld.cards.splice(0, meldLength - 7);
			for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++)
				usedCards.push(meld.cards[cardIndex]);
		}

		this.removeUsedCards(hand, usedCards);
	};

	robotAnalizeHand.scoreRuns = function(robot) {
		for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
			var suit = robot.hand.runs[suitIndex];
			if (suit.runLength === 0)
				continue;
			
			// find the longest stretch of cards of 3 or more
			var cardCount = 0;
			var runStarted = false;
			var lowestCard = -1;
			for (var cardIndex = 0; cardIndex < 7; cardIndex++) {
				if (suit.cards[cardIndex + suit.runOffset]) {
					if (!runStarted) {
						runStarted = true;
						lowestCard = cardIndex;
					}
					cardCount++;
				} else {
					if (cardCount < 3) {
						runStarted = false;
						cardCount = 0;
						lowestCard = -1;
					} else
						break;
				}
			}
			
			// see if there are playable cards and score them
			if (cardCount > 2) {
				suit.playableOffset = lowestCard;
				suit.playableLength = cardCount;
				var below8 = 4 - lowestCard;
				if (below8 > cardCount)
					below8 = cardCount;
				var above8 = lowestCard + cardCount - 4;
				if (above8 < 0)
					above8 = 0;
				if (lowestCard + cardCount === 11) {
					suit.score = 20;
					above8--;
				}
				suit.score += below8 * 5 + above8 * 10;
			}
		}
	};
	
	robotAnalizeHand.removeUsedCards = function(hand, usedCards) {
		// remove used cards from hand
		for (var usedIndex = 0; usedIndex < usedCards.length; usedIndex++) {
			var cardPosition = hand.indexOf(usedCards[usedIndex]);
			hand.splice(cardPosition, 1);
		}
	};
	
	return robotAnalizeHand;
})();