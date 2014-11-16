// factory for play game view
Array.prototype.move = function(fromIndex, toIndex) {
	var element = this[fromIndex];
	this.splice(fromIndex, 1);
	this.splice(toIndex, 0, element);
};

angular.module('handAndFoot')
	.factory('playGame', ['$http', 
		'chatSocket',
		'sharedProperties',
		function($http, chatSocket, sharedProperties){
			var playGame = { 
				gameId: sharedProperties.getGameId(),
				person: sharedProperties.getPerson(),
				direction: sharedProperties.getDirection()
			};
			
			// join game message
			playGame.joinGame = function() {
				chatSocket.emit('joinGame', {gameId: this.gameId, personId: this.person._id, name: this.person.name, direction: this.direction});
			}
			
			// leave the game
			playGame.leaveGame = function() {
				chatSocket.emit('leaveGame');
			};
			
			// leave the game
			playGame.resignRequest = function() {
				chatSocket.emit('resignRequest');
			};
			
			// leave the game
			playGame.resignResponse = function(data) {
				chatSocket.emit('resignResponse', data);
			};

			// reset any highlighted flags
			playGame.resetHighlight = function(player, scope) {
				for (var cardIndex = 0; cardIndex < player.handCards.length; cardIndex++) {
					// do not reset if it is drawn from the discard pile
					if (!scope.drawFromDiscard.topCard
					|| player.handCards[cardIndex] != $scope.drawFromDiscard.topCard)
						player.handCards[cardIndex].highlight = false;
				}
				for (var cardIndex = 0; cardIndex < player.footCards.length; cardIndex++) {
					// do not reset if it is drawn from the discard pile
					if (!scope.drawFromDiscard.topCard
					|| player.footCards[cardIndex] != $scope.drawFromDiscard.topCard)
						player.footCards[cardIndex].highlight = false;
				}
			};

			// return any highlighted cards
			playGame.highlightedCards = function(player) {
				var cards = [];
				if (!player.inFoot) {
					for (var cardIndex = 0; cardIndex < player.handCards.length; cardIndex++)
						if (player.handCards[cardIndex].highlight)
							cards.push(player.handCards[cardIndex]);
				} else {
					for (var cardIndex = 0; cardIndex < player.footCards.length; cardIndex++)
						if (player.footCards[cardIndex].highlight)
							cards.push(player.footCards[cardIndex]);
				}
				return cards;
			};
			
			// check to see if the player is allowed to draw from discard pile
			playGame.canDrawFromDiscard = function(scope) {
				var discardPile = scope.piles[4];
				
				// are there cards on the discard pile?
				if (discardPile.cards.length === 0)
					return "There are no cards to draw from the discard pile.";
					
				// cannot draw if the top card is a wild card or black 3
				var topCard = discardPile.cards[scope.piles[4].cards.length - 1];
				if (this.isWildCard(topCard))
					return "Cannot draw from discard pile when there is a wild card on top.";
				if (this.isBlackThree(topCard))
					return "Cannot draw from discard pile when there is a black 3 on top.";
					
				// pile locked if your team has no melds or there is a wildcard in the discard pile
				var pileLocked = !scope.control.hasMelds;
				if (!pileLocked) {
					for (var cardIndex = 0; cardIndex < discardPile.cards.length; cardIndex++) {
						if (this.isWildCard(discardPile.cards[cardIndex])) {
							pileLocked = true;
							break;
						}
					}
				}
				
				// count the number of cards of the same number in your hand
				var hand = scope.players[0].inFoot ? scope.players[0].footCards : scope.players[0].handCards;
				var sameNumber = this.countSameNumber(hand, topCard);
				
				// okay if there are 2 or more
				if (sameNumber > 1)
					return false;
					
				// okay if pile not locked and there is 1 + wild cards
				if (!pileLocked && sameNumber === 1 && this.countWildCards(hand) > 0)
					return false;

				// does the card fit for a run
				var cards = [ false, false, false, false, false, false, false, false, false, false, false, false, false ];
				// begin by looping through the hand for all the cards in the same suit
				for (cardIndex = 0; cardIndex < hand.length; cardIndex++) {
					if (hand[cardIndex].suitNumber === topCard.suitNumber)
						cards[hand[cardIndex].cardNumber] = true;
				}
				
				// check for 2 cards lower than the top card
				if (topCard.cardNumber > 3 // the top card is a 6 or higher
				&& cards[topCard.cardNumber - 2] && cards[topCard.cardNumber - 1])
					return false;
				
				// check for 2 cards higher than the top card
				if (topCard.cardNumber < 11 // the top card is a Q or lower
				&& cards[topCard.cardNumber + 2] && cards[topCard.cardNumber + 1])
					return false;
				
				// check for 1 card higher and 1 lower
				if (topCard.cardNumber > 2 // the top card is a 5 or higher
				&& topCard.cardNumber < 12 // the top card is a W or lower
				&& cards[topCard.cardNumber - 1] && cards[topCard.cardNumber + 1])
					return false;
				
				// error if pile locked and you have < 2 of the same number
				if (pileLocked)
					return "The discard pile is locked and you do not have 2 naturals in your hand.";

				return "You need two naturals or one natural and one wild card.";
			};
			
			// check to see if the player is allowed to end their turn
			playGame.canEndTurn = function(scope, card, melds) {
				// if there were no melds and now there are melds, ensure that the score
				// is high enough
				var nowHasMelds = false;
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					if (scope.teams[0].melds[meldIndex].type !== 'Red Three') {
						nowHasMelds = true;
						break;
					}
				}
				if (!scope.control.hasMelds && nowHasMelds)
					if (!melds.layDownScoreMet(scope))
						return "Minimum score for lay down not yet met.";

				// can't discard a red three
				if (this.isRedThree(card))
					return "Cannot discard a red three.";

				// can't discard a wild card if it is the last card
				if (this.isWildCard(card)) {
					if (scope.players[0].inFoot 
					&& scope.players[0].footCards.length === 1)
						return "Can't discard a wild card as your final discard.";
					
					// otherwise okay to discard a wild card
					return false;
				}
				
				// make sure that the card isn't playable
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					var meld = scope.teams[0].melds[meldIndex];
					if (meld.isComplete)
						continue;
					if (meld.type === "Red Three" || meld.type === "Wild Card Meld")
						continue;
						
					// if the card number matches on regular meld then error
					if (meld.type === "Clean Meld" || meld.type === "Dirty Meld") {
						if (meld.number === card.cardNumber)
							return "That card is playable.";
						continue;
					}
					
					// if the meld is a run then can the card play top or bottom?
					if (meld.cards[0].suitNumber === card.suitNumber) {
						var maxCardNumber = meld.cards[0].cardNumber;
						var minCardNumber = meld.cards[meld.cards.length - 1].cardNumber;
						if (card.cardNumber === minCardNumber - 1)
							return "That card is playable on a run.";
						if (card.cardNumber === maxCardNumber + 1)
							return "That card is playable on a run.";
					}
				}
				
				return false;
			};
			
			// check to see if the player is allowed to discard
			playGame.canDiscard = function(scope, card, melds) {
				// if there were no melds and now there are melds, ensure that the score
				// is high enough
				var nowHasMelds = false;
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					if (scope.teams[0].melds[meldIndex].type !== 'Red Three') {
						nowHasMelds = true;
						break;
					}
				}
				if (!scope.control.hasMelds && nowHasMelds)
					if (!melds.layDownScoreMet(scope))
						return "Minimum score for lay down not yet met.";

				// can't discard a red three
				if (this.isRedThree(card))
					return "Cannot discard a red three.";

				// can't discard a wild card if it is the last card
				if (this.isWildCard(card)) {
					if (scope.players[0].inFoot 
					&& scope.players[0].footCards.length === 1)
						return "Can't discard a wild card as your final discard.";
					
					// otherwise okay to discard a wild card
					return false;
				}
				
				// make sure that the card isn't playable
				for (var meldIndex = 0; meldIndex < scope.teams[0].melds.length; meldIndex++) {
					var meld = scope.teams[0].melds[meldIndex];
					if (meld.isComplete)
						continue;
					if (meld.type === "Red Three" || meld.type === "Wild Card Meld")
						continue;
						
					// if the card number matches on regular meld then error
					if (meld.type === "Clean Meld" || meld.type === "Dirty Meld") {
						if (meld.number === card.cardNumber)
							return "That card is playable.";
						continue;
					}
					
					// if the meld is a run then can the card play top or bottom?
					if (meld.cards[0].suitNumber === card.suitNumber) {
						var maxCardNumber = meld.cards[0].cardNumber;
						var minCardNumber = meld.cards[meld.cards.length - 1].cardNumber;
						if (card.cardNumber === minCardNumber - 1)
							return "That card is playable on a run.";
						if (card.cardNumber === maxCardNumber + 1)
							return "That card is playable on a run.";
					}
				}
				
				return false;
			};

			playGame.isWildCard = function(card) {
				return card.suitNumber === 4 || card.cardNumber === 0;
			}
			
			playGame.isBlackThree = function(card) {
				return (card.suitNumber === 0 || card.suitNumber === 3) && card.cardNumber === 1;
			};
			
			playGame.isRedThree = function(card) {
				return (card.suitNumber === 1 || card.suitNumber === 2) && card.cardNumber === 1;
			};
			
			// count the number of cards that match by number
			playGame.countSameNumber = function(cards, matchingCard) {
				var count = 0;
				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
					if (cards[cardIndex].cardNumber === matchingCard.cardNumber)
						count++;
				}
				return count;
			};
			
			// count the number of wild cards
			playGame.countWildCards = function(cards) {
				var count = 0;
				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
					if (this.isWildCard(cards[cardIndex]))
						count++;
				}
				return count;
			};

			// send an update to the server
			playGame.sendUpdate = function(scope) {
				var data = {
					player: scope.players[0],
					piles: scope.piles,
					melds: scope.teams[0].melds,
					control: scope.control
				};
				chatSocket.emit('updateGame', data);
				
				for (var messageIndex = 0; messageIndex < scope.control.gameMessages.length; messageIndex++)
					chatSocket.emit('gameMessage', { message: scope.control.gameMessages[messageIndex] });
				scope.control.gameMessages = [];
			};
			
			playGame.sendGameMessage = function(scope, message) {
				scope.control.gameMessages.push(scope.players[0].person.name + " " + message);
			}
			
			playGame.clearUndo = function(scope) {
				scope.undo = [];
			};
			
			playGame.updateUndo = function(scope) {
				var undo = {
					game: angular.copy(scope.game),
					piles: angular.copy(scope.piles),
					players: angular.copy(scope.players),
					teams: angular.copy(scope.teams),
					control: angular.copy(scope.control),
					drawFromDiscard: angular.copy(scope.drawFromDiscard)
				};
				scope.undo.push(undo);
			};
			
			playGame.applyUndo = function(scope) {
				if (scope.undo.length === 0)
					return;

				var undo = scope.undo.pop();
				scope.game = undo.game;
				scope.piles = undo.piles;
				scope.players = undo.players;
				scope.teams = undo.teams;
				scope.control = undo.control;
				scope.drawFromDiscard = undo.drawFromDiscard;
			};

			// send an update to the server
			playGame.sendChat = function(chat) {
				var data = {
					chat: chat
				};
				chatSocket.emit('sendChat', data);
			};

			// send an update to the server
			playGame.sendEndHandQuestion = function() {
				chatSocket.emit('endHandQuestion');
			};
			
			// send end hand response
			playGame.endHandResponse = function(data) {
				chatSocket.emit('endHandResponse', data);
			};
			
			return playGame;
		}
	]);

