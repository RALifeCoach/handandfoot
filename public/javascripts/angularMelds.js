angular.module('handAndFoot')
	.factory('melds', ['cardArrays',
		function(cardArrays){
			var scoresToMeet = [ 
				{score: 50, autoOnSeven: false},
				{score: 90, autoOnSeven: false},
				{score: 120, autoOnSeven: false},
				{score: 150, autoOnSeven: false},
				{score: 190, autoOnSeven: true},
				{score: 220, autoOnSeven: true},
				{score: 250, autoOnSeven: true}
			];
			var cardScores = [ 20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 20];
			
			// private method to build the red three melds
			function buildRedThrees(scope) {
				if (cardArrays.blackThrees.length > 0
				|| cardArrays.wildCards.length > 0
				|| cardArrays.suitCount > 0)
					return "Red threes must be played without other cards.";

				for (var cardIndex = 0; cardIndex < cardArrays.redThrees.length; cardIndex++) {
					scope.teams[0].melds.push({ 
						type: "Red Three", 
						isComplete: true, 
						number: -1, 
						cards: [ cardArrays.redThrees[cardIndex] ] });
					scope.teams[0].counts[0].count++;
					scope.control.turnState = 'draw3';
					scope.control.drawCards++
				}
				
				return false;
			}

			function buildBlackThrees(scope) {
				// return if there are not enough cards to start a new meld
				if (cardArrays.selectedCards.length < 3)
					return "Must start a meld with at least 3 cards.";

					// black threes played alone
				if (cardArrays.wildCards.length > 0
				|| cardArrays.suitCount > 0)
					return "Black threes must be played without other cards."
					
				// can play if in foot and one remaining card
				if (scope.players[0].inFoot 
				&& cards.length === footCardsRemaining - 1 
				&& cards.length > 2 
				&& cards.length < 8)
				{
					var meld = {type: "Black Three", isComplete: false, number: -1, cards: []};
					for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
						meld.cards.push(cards[cardIndex]);
					}
					return false;
				}

				return "Black threes can only be played as you go out.";
			}
			
			function addWildCardsToMeld(clickedMeld, scope) {
				// ensure it is a number based meld (if 3 or more wilds assume starting a new meld)
				if (clickedMeld.type === 'Clean Meld' 
				|| clickedMeld.type === 'Dirty Meld' 
				|| clickedMeld.type === 'Wild Card Meld') {
					// count naturals and wilds
					var naturals = 0;
					var wilds = 0;
					for (var cardIndex = 0; cardIndex < clickedMeld.cards.length; cardIndex++) {
						if (clickedMeld.cards[cardIndex].cardNumber > -1)
							naturals++;
						else
							wilds++
					}
					if (clickedMeld.type !== 'Wild Card Meld' && wilds + cardArrays.wildCards.length >= naturals) {
						if (cardArrays.wildCards.length < 3)
							return "Too many wild cards for this meld.";
					} else {
						if (cardArrays.wildCards.length + clickedMeld.cards.length > 7)
							return "Too many cards for the meld.";
						// add the wild cards to the meld
						for (var cardIndex = 0; cardIndex < cardArrays.wildCards.length; cardIndex++) {
							clickedMeld.cards.unshift(cardArrays.wildCards[cardIndex]);
							if (clickedMeld.type === 'Clean Meld')
								clickedMeld.type = "Dirty Meld";
						}

						if (clickedMeld.cards.length === 7) {
							clickedMeld.isComplete = true;
							switch (clickedMeld.type) {
								case "Clean Meld":
									scope.teams[0].counts[1].count++;
									break;
								case "Dirty Meld":
									scope.teams[0].counts[2].count++;
									break;
								case "Wild Card Meld":
									scope.teams[0].counts[4].count++;
									break;
							}
						}
						
						return false;
					}
				}
				if (wildCards.length < 3)
					return "Cannot add wild cards to this meld.";
				
				return true;
			}
			
			function buildWildCardMelds(scope) {
				// see if there is an existing wild card meld
				var meld = false;
				var meldFound = false;
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					if (!scope.teams[0].melds[meldIndex].isComplete 
					&& scope.teams[0].melds[meldIndex].type === "Wild Card Meld") {
						meld = scope.teams[0].melds[meldIndex];
						meldFound = true;
						break;
					}
				}
				
				if (!meld) {
					// return if there are not enough cards to start a new meld
					if (cardArrays.wildCards.length.length < 3)
						return "Must start a meld with at least 3 cards.";

					meld = {type: "Wild Card Meld", isComplete: false, number: -1, cards: []};
				}
					
				// fill meld with cards
				while (cardArrays.wildCards.length > 0) {
					var card = cardArrays.wildCards.pop();
					meld.cards.push(card);
					if (meld.cards.length === 7) {
						meld.isComplete = true;
						if (meldFound)
							meldFound = false;
						else
							scope.teams[0].melds.push(meld);
						scope.teams[0].counts[4].count++;
						meld = {type: "Wild Card Meld", isComplete: false, number: -1, cards: []};
					}
				}

				if (!meldFound && meld.cards.length > 0)
					scope.teams[0].melds.push(meld);
				
				return false;
			}

			function buildSuitMeld(clickedMeld, scope) {
				var meld = clickedMeld;
				var meldFound = clickedMeld !== false;
					
				if (!meld) {
					// check to see if there is an existing meld of this number
					for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
						var thisMeld = scope.teams[0].melds[meldIndex];
						if (!thisMeld.isComplete 
						&& (thisMeld.type === 'Clean Meld' || thisMeld.type === 'Dirty Meld')
						&& thisMeld.number === cardArrays.meldNumber) {
							meld = thisMeld;
							meldFound = true;
							break;
						}
					}
				}

				// return if there are not enough cards to start a new meld
				if (!meld && cardArrays.selectedCards.length < 3)
					return "Must start a meld with at least 3 cards.";

				if (!meld 
				&& cardArrays.numbers[cardArrays.meldNumber].cards.length <= cardArrays.wildCards.length)
					return "There must be more naturals than wild cards."
				
				// if there is an existing meld of 5 or 6 cards 
				// and the new cards are coming from a draw from the pile
				// then start a new meld
				if (meld
				&& meld.cards.length > 4
				&& scope.drawFromDiscard.topCard) {
					meld = false;
				}
				
				// if meld clicked or an existing meld exists
				if (meld) {
					if (meld.cards.length + cardArrays.numbers[cardArrays.meldNumber].cards.length + cardArrays.wildCards.length > 7)
						return "Maximum meld size is 7 cards.";
					if (meld.number !== cardArrays.meldNumber)
						return "Cannot add that card to this meld.";
					
					for (var cardIndex = 0; cardIndex < cardArrays.numbers[cardArrays.meldNumber].cards.length; cardIndex++) {
						meld.cards.push(cardArrays.numbers[cardArrays.meldNumber].cards[cardIndex]);
					}
					
					for (var cardIndex = 0; cardIndex < cardArrays.wildCards.length; cardIndex++) {
						meld.cards.unshift(cardArrays.wildCards[cardIndex]);
						meld.type = "Dirty Meld";
					}
					
					if (meld.cards.length === 7) {
						meld.isComplete = true;
						if (meld.type === "Clean Meld")
							scope.teams[0].counts[1].count++;
						else
							scope.teams[0].counts[2].count++;
					}
					
					return false;
				}
				
				if (cardArrays.numbers[cardArrays.meldNumber].cards.length + cardArrays.wildCards.length > 7)
					return "Maximum meld size is 7 cards.";
					
				var meld = {type: "Clean Meld", isComplete: false, number: cardArrays.meldNumber, cards: []};
				for (var cardIndex = 0; cardIndex < cardArrays.numbers[cardArrays.meldNumber].cards.length; cardIndex++) {
					meld.cards.push(cardArrays.numbers[cardArrays.meldNumber].cards[cardIndex]);
				}
				
				for (var cardIndex = 0; cardIndex < cardArrays.wildCards.length; cardIndex++) {
					meld.cards.unshift(cardArrays.wildCards[cardIndex]);
					meld.type = "Dirty Meld";
				}
				
				if (meld.cards.length === 7) {
					meld.isComplete = true;
					if (meld.type === "Clean Meld")
						scope.teams[0].counts[1].count++;
					else
						scope.teams[0].counts[2].count++;
				}

				scope.teams[0].melds.push(meld);

				return false;
			}
			
			function buildRunMeld(clickedMeld, scope) {
				// check for run
				if (cardArrays.suitCount > 1)
					return "Inconsistent cards for a meld.";
				if (cardArrays.wildCards.length > 0)
					return "Inconsistent cards for a meld.";
				if (cardArrays.numberCount > 7)
					return "Too many cards for a run.";
				
				// get the cards for a possible run
				var hasGap = false;
				var runStarted = false;
				var cards = [];
				var minCardNumber = -1;
				var maxCardNumber = -1;
				for (var numberIndex = 0; numberIndex < cardArrays.numbers.length; numberIndex++) {
					var number = cardArrays.numbers[numberIndex];
					if (number.cards.length > 1)
						return "Inconsistent cards for a meld.";
					if (number.cards.length === 1) {
						if (!runStarted) {
							runStarted = true;
							minCardNumber = number.cards[0].cardNumber;
						} else if (hasGap)
							return "Inconsistent cards for a meld.";
						cards.push(number.cards[0]);
						maxCardNumber = number.cards[0].cardNumber;
					} else {
						if (runStarted) {
							hasGap = true;
						}
					}
				}
				if (!clickedMeld && cards.length < 3)
					return "Too few cards to start a new run";
				
				if (clickedMeld) {
					// ensure it is the same suit`
					if (clickedMeld.cards[0].suitNumber !== cards[0].suitNumber)
						return "Wrong suit for this meld.";
				
					// ensure that the cards being added touch the cards in the meld
					if (maxCardNumber < clickedMeld.cards[0].cardNumber
					&& maxCardNumber !== clickedMeld.cards[0].cardNumber - 1)
						return "Invalid cards to add to the run.";
					if (minCardNumber > clickedMeld.cards[clickedMeld.cards.length - 1].cardNumber
					&& minCardNumber !== clickedMeld.cards[clickedMeld.cards.length - 1].cardNumber + 1)
						return "Invalid cards to add to the run.";
					
					// ensure that we don't go over 7 cards
					if (clickedMeld.cards.length + cards.length > 7)
						return "Too many cards for this meld.";
				}
				
				// we have a run or are adding to an existing run 
				var meld = {type: "Run", isComplete: false, number: -1, cards: []};
				if (clickedMeld)
					meld = clickedMeld;
				
				if (clickedMeld && maxCardNumber < clickedMeld.cards[0].cardNumber) {
					for (var cardIndex = cards.length - 1; cardIndex >= 0; cardIndex--)
						meld.cards.unshift(cards[cardIndex]);
				} else {
					for (var cardIndex = 0; cardIndex < cards.length; cardIndex++)
						meld.cards.push(cards[cardIndex]);
				}

				if (meld.cards.length === 7) {
					meld.isComplete = true;
					scope.teams[0].counts[3].count++;
				}

				if (!clickedMeld)
					scope.teams[0].melds.push(meld);
			}
			
			function drawSevenCards(scope) {
				scope.drawFromDiscard.topCard = false;
				
				// the first card is already moved to the player
				scope.piles[4].cards.pop();
				
				var cards = scope.players[0].inFoot ? scope.players[0].footCards : scope.players[0].handCards;
				for (var cardIndex = 0; cardIndex < 6 && scope.piles[4].cards.length > 0; cardIndex++) {
					cards.push(scope.piles[4].cards.pop());
				}
			}

			function calculatePointsSoFar(scope) {
				var score = 0;
				
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					var meld = scope.teams[0].melds[meldIndex];
					//ignore red threes
					if (meld.type === 'Red Three')
						continue;
					
					// score each card in the meld
					for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++) {
						if (meld.cards[cardIndex].suitNumber === 4)
							score += 50;
						else
							score += cardScores[meld.cards[cardIndex].cardNumber];
					}
				}
				
				return score;
			}
			
			// base object
			var o = { 
			};
			
			// public method to build melds (or return an error)
			o.makeMelds = function(clickedMeld, scope) {
				cardArrays.buildCardArrays(scope.players[0]);
				if (cardArrays.selectedCards.length === 0)
					return "Select one or more cards for a meld.";

				var cards = cardArrays.selectedCards;

				// handle red threes - one meld for each red three
				if (cardArrays.redThrees.length > 0) {
					return buildRedThrees(scope);
				}
				
				if (cardArrays.blackThrees.length > 0) {
					return buildBlackThrees(scope);
				}

				// selected only wild cards and a meld was clicked
				if (clickedMeld && cardArrays.wildCards.length > 0 && cardArrays.suitCount === 0) {
					var message = addWildCardsToMeld(clickedMeld, scope);
					// true means continue. false or a message means return
					if (message !== true)
						return message;
				}
				
				// check for meld of wild cards
				if (cardArrays.wildCards.length > 2 && cardArrays.suitCount === 0) {
					return buildWildCardMelds(scope);
				}
				
				// check for suit meld
				if ((!clickedMeld || clickedMeld.type !== "Run") && cardArrays.numberCount === 1) {
					return buildSuitMeld(clickedMeld, scope);
				}
				
				return buildRunMeld(clickedMeld, scope);
			};

			o.clickMeld = function(meld, scope) {
				scope.message = false;
				if (!scope.players[0].turn)
					return;
				
				if (scope.control.turnState !== 'play')
					return "Draw cards before playing.";
				
				var message = this.makeMelds(meld, scope);
				if (message)
					return message;
				
				scope.teams[0].melds.sort(function (a, b) {
					if (a.type === 'Run')
						return 1;
					if (b.type === 'Run')
						return -1;
					if (a.type === 'Wild Card Meld')
						return 1;
					if (b.type === 'Wild Card Meld')
						return -1;
					return (a.number > b.number ? 1 : -1);
				});
				
				// remove the played cards from the hand
				var cards = scope.players[0].inFoot ? scope.players[0].footCards : scope.players[0].handCards;
				for (var cardIndex = 0; cardIndex < cardArrays.selectedCards.length; cardIndex++) {
					var index = cards.indexOf(cardArrays.selectedCards[cardIndex]);
					cards.splice(index, 1);
				}
				
				if (!scope.control.hasMelds)
					scope.control.pointsSoFar = calculatePointsSoFar(scope);
				else
					scope.teams[0].basePoints = this.calculateBase(scope.teams[0]);
				
				// if the player has drawn from the pile, determine if they get the rest of the cards
				if (scope.drawFromDiscard.topCard) {
					// if there are melds already then okay to get rest
					if (scope.hasMelds) {
						drawSevenCards(scope);
						return;
					}
					
					// no melds - if the score is high enough then give cards
					if (this.layDownScoreMet(scope)) {
						drawSevenCards(scope);
						scope.control.hasMelds = true;
					}
					
					// do not check foot if there was a draw from the discard pile
					return;
				}

				if (this.layDownScoreMet(scope)) {
					scope.control.hasMelds = true;
				}
				// set inFoot
				scope.players[0].inFoot = scope.players[0].handCards.length === 0;
			}
			
			// check if the meld score is high enough
			o.layDownScoreMet = function(scope) {
				var score = 0;
				var scoreToMeet = scoresToMeet[scope.game.round].score;
				var autoOnSeven = scoresToMeet[scope.game.round].autoOnSeven;
				
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					var meld = scope.teams[0].melds[meldIndex];
					//ignore red threes
					if (meld.type === 'Red Three')
						continue;
					// true if a meld is complete (except a dirty meld) and auto on 7 cards is true
					if (autoOnSeven && meld.isComplete && meld.type !== "Dirty Meld")
						return true;
					
					// score each card in the meld
					for (var cardIndex = 0; cardIndex < meld.cards.length; cardIndex++) {
						if (meld.cards[cardIndex].suitNumber === 4)
							score += 50;
						else
							score += cardScores[meld.cards[cardIndex].cardNumber];
					}
				}
				
				return score >= scoreToMeet;
			}
			
			// calculate the score on complete melds
			o.calculateBase = function(team) {
				var score = 0;
				
				for (var meldIndex = 0; meldIndex < team.melds.length; meldIndex++) {
					var meld = team.melds[meldIndex];
					
					switch (meld.type) {
						case 'Red Three':
							score += 100;
							break;
						case 'Clean Meld':
							score += meld.isComplete ? 500 : 0;
							break;
						case 'Dirty Meld':
							score += meld.isComplete ? 300 : 0;
							break;
						case 'Run':
							score += meld.isComplete ? 2000 : -2000;
							break;
						case 'Wild Card Meld':
							score += meld.isComplete ? 1000 : -1000;
							break;
					}
				}
				
				return score;
			}
			
			// sort the hand by number
			o.sortByNumber = function(player) {
				// highlight all the cards in the hand or foot so that card arrays will arrange all the cards
				var cards = player.inFoot ? player.footCards : player.handCards;
				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++)
					cards[cardIndex].highlight = true;
					
				cardArrays.buildCardArrays(player);

				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++)
					cards[cardIndex].highlight = false;
				
				var sortedCards = [];

				// first add wild cards
				for (var cardIndex = 0; cardIndex < cardArrays.wildCards.length; cardIndex++) {
					sortedCards.push(cardArrays.wildCards[cardIndex]);
				}
				
				// next add cards by number - from ace down to 4
				for (var numberIndex = 12; numberIndex >= 2; numberIndex--) {
					for (var cardIndex = 0; cardIndex < cardArrays.numbers[numberIndex].cards.length; cardIndex++) {
						sortedCards.push(cardArrays.numbers[numberIndex].cards[cardIndex]);
					}
				}
				
				// next add black threes
				for (var cardIndex = 0; cardIndex < cardArrays.blackThrees.length; cardIndex++) {
					var card = cardArrays.blackThrees[cardIndex];
					if (card.suitNumber === 0 || card.suitNumber === 3) {
						sortedCards.push(card);
					}
				}
				
				// finally add red threes
				for (var cardIndex = 0; cardIndex < cardArrays.redThrees.length; cardIndex++) {
					var card = cardArrays.redThrees[cardIndex];
					if (card.suitNumber === 1 || card.suitNumber === 2) {
						sortedCards.push(card);
					}
				}
				
				if (player.inFoot)
					player.footCards = sortedCards;
				else
					player.handCards = sortedCards;
			}
			
			// sort the hand by suit
			o.sortBySuit = function(player) {
				// highlight all the cards in the hand or foot so that card arrays will arrange all the cards
				var cards = player.inFoot ? player.footCards : player.handCards;
				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++)
					cards[cardIndex].highlight = true;
					
				cardArrays.buildCardArrays(player);

				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++)
					cards[cardIndex].highlight = false;
					
				var sortedCards = [];

				// first add wild cards
				for (var cardIndex = 0; cardIndex < cardArrays.wildCards.length; cardIndex++) {
					sortedCards.push(cardArrays.wildCards[cardIndex]);
				}
				
				// next add cards by suit
				for (var suitIndex = 0; suitIndex < 4; suitIndex++) {
					var suitCards = cardArrays.suits[suitIndex].cards;
					suitCards.sort(function (a, b) {
						return (a.cardNumber < b.cardNumber ? 1 : -1);
					});
					for (var cardIndex = 0; cardIndex < suitCards.length; cardIndex++) {
						sortedCards.push(suitCards[cardIndex]);
					}
				}
				
				// next add black threes
				for (var cardIndex = 0; cardIndex < cardArrays.blackThrees.length; cardIndex++) {
					var card = cardArrays.blackThrees[cardIndex];
					if (card.suitNumber === 0 || card.suitNumber === 3) {
						sortedCards.push(card);
					}
				}
				
				// finally add red threes
				for (var cardIndex = 0; cardIndex < cardArrays.redThrees.length; cardIndex++) {
					var card = cardArrays.redThrees[cardIndex];
					if (card.suitNumber === 1 || card.suitNumber === 2) {
						sortedCards.push(card);
					}
				}
				
				if (player.inFoot)
					player.footCards = sortedCards;
				else
					player.handCards = sortedCards;
			}
			
			return o;
		}
	]);
