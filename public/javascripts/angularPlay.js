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
			var o = { 
				gameId: sharedProperties.getGameId(),
				person: sharedProperties.getPerson(),
				direction: sharedProperties.getDirection()
			};
			
			// join game message
			o.joinGame = function() {
				chatSocket.emit('joinGame', {gameId: this.gameId, personId: this.person._id, direction: this.direction});
			}
			
			// leave the game
			o.leaveGame = function() {
				chatSocket.emit('leaveGame');
			};

			// reset any highlighted flags
			o.resetHighlight = function(player, scope) {
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
			o.highlightedCards = function(player) {
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
			o.canDrawFromDiscard = function(scope) {
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
				
				// error if you don't have any of the same number
				if (sameNumber === 0)
					return "You do not have any of the same card number in your hand.";
				
				// error if pile locked and you have < 2 of the same number
				if (pileLocked && sameNumber < 2)
					return "The discard pile is locked and you do not have 2 naturals in your hand.";

				// if not locked must have at least 1 and a wild
				var wildCards = this.countWildCards(hand);
				if (!pileLocked && sameNumber < 2 && wildCards < 1)
					return "You need two naturals or one natural and one wild card.";

				// TODO - two other cards for a run
				return false;
			};
			
			// check to see if the player is allowed to end their turn
			o.canEndTurn = function(scope, card, melds) {
				// if there were no melds and now there are melds, ensure that the score
				// is high enough
				if (!scope.control.hasMelds && scope.teams[0].melds.length > 0)
					if (!melds.layDownScoreMet(scope))
						return "Minimum score for lay down not yet met.";

				// can't discard a red three
				if (this.isRedThree(card))
					return "Cannot discard a red three.";

				// can't discard a wild card if it is the last card
				if (this.isWildCard(card)) {
					if (scope.players[0].inFoot 
					&& scope.players[0].cards.length === 1)
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
						var minCardNumber = meld.cards[0].cardNumber;
						var maxCardNumber = meld.cards[meld.cards.length - 1].cardNumber;
						if (card.cardNumber === minCardNumber - 1)
							return "That card is playable on a run.";
						if (card.cardNumber === maxCardNumber + 1)
							return "That card is playable on a run.";
					}
				}
				
				return false;
			};

			o.isWildCard = function(card) {
				return card.suitNumber === 4 || card.cardNumber === 0;
			}
			
			o.isBlackThree = function(card) {
				return (card.suitNumber === 0 || card.suitNumber === 3) && card.cardNumber === 1;
			};
			
			o.isRedThree = function(card) {
				return (card.suitNumber === 1 || card.suitNumber === 2) && card.cardNumber === 1;
			};
			
			// count the number of cards that match by number
			o.countSameNumber = function(cards, matchingCard) {
				var count = 0;
				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
					if (cards[cardIndex].cardNumber === matchingCard.cardNumber)
						count++;
				}
				return count;
			};
			
			// count the number of wild cards
			o.countWildCards = function(cards) {
				var count = 0;
				for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
					if (this.isWildCard(cards[cardIndex]))
						count++;
				}
				return count;
			};

			// send an update to the server
			o.sendUpdate = function(scope) {
				var data = {
					player: scope.players[0],
					piles: scope.piles,
					melds: scope.teams[0].melds,
					control: scope.control
				};
				chatSocket.emit('updateGame', data);
			};
			
			o.clearUndo = function(scope) {
				scope.undo = [];
			};
			
			o.updateUndo = function(scope) {
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
			
			o.applyUndo = function(scope) {
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
			o.sendChat = function(chat) {
				var data = {
					chat: chat
				};
				chatSocket.emit('sendChat', data);
			};
			
			return o;
		}
	]);

// controller for play game
angular.module('handAndFoot')
	.controller('PlayCtrl', ['$scope',
		'$location',
		'playGame',
		'melds',
		function ($scope, $location, player, melds) {
			var roundPoints = [ 50, 90, 120, 150, 190, 220, 250 ];
			$scope.game = {};
			$scope.piles = [ { cards: []}, {cards: []}, {cards: []}, {cards: []}, {cards: []} ];
			$scope.players = [];
			$scope.teams = [ 
				{ basePoints: 0, counts: [], melds: [] }, 
				{ basePoints: 0, counts: [], melds: [] } 
			];
			$scope.control = {
				turnState: 'draw1',
				hasMelds: false,
				drawCards: 0, // used when playing 3 threes
				pointsNeeded: 0,
				pointsSoFar: 0
			};
			$scope.drawFromDiscard = {};
			$scope.drawFromDiscard.topCard = false;
			$scope.message = false;
			$scope.undo = [];

			// if no game present then go get it
			if (!player.gameId) {
				$location.path('/games');
				return;
			}

			player.joinGame();

			// listen for game update message
			$scope.$on('socket:gameUpdate', function(event, data) {
				console.log('game update');
				$scope.game = data.game;
				$scope.players = data.players;
				$scope.piles = data.game.piles;
				$scope.teams = data.teams;
				$scope.teams[0].basePoints = melds.calculateBase($scope.teams[0]);
				$scope.teams[1].basePoints = melds.calculateBase($scope.teams[1]);
				$scope.control.turnState = data.game.turnState;
				$scope.control.hasMelds = data.teams[0].melds.length > 0;
				//$scope.control.drawCards = data.game.drawCards;
				$scope.control.pointsNeeded = roundPoints[data.game.round];
				
				$scope.chatLine = '';
				$scope.chatText = '';

				$scope.undo = [];
				
				player.resetHighlight($scope.players[0], $scope);
			});

			// listen for game update message
			$scope.$on('socket:chatUpdate', function(event, data) {
				console.log('chatUpdate');
				
				if ($scope.chatText !== '')
					$scope.chatText += '\n';
				$scope.chatText += data.chatText;
			});

			// listen for game update message
			$scope.$on('socket:error', function(event, data) {
				console.log(event);
				console.log(data);
				if (data.leaveGame)
					$location.path('/games');
			});

			// leave the game
			$scope.leaveGame = function() {
				player.leaveGame();
				$location.path('/games');
			};

			// click on one of the cards in the hand
			$scope.clickCard = function(event, inFoot, cardIndex) {
				event.stopPropagation();

				console.log('click ' + cardIndex);
				$scope.message = false;
				if (!$scope.players[0].turn)
					return;

				if ($scope.control.turnState !== 'play') {
					$scope.message = "Draw cards before playing.";
					return;
				}

				var cards = inFoot ? $scope.players[0].footCards : $scope.players[0].handCards;
				if ($scope.drawFromDiscard.topCard
				&& cards[cardIndex] == $scope.drawFromDiscard.topCard) {
					$scope.message = "You must play this card.";
					return;
				}
				
				cards[cardIndex].highlight = !cards[cardIndex].highlight;
			};

			// handle drop complete
			$scope.onDropComplete = function (inFoot, index, obj, evt) {
				$scope.message = false;
				console.log('drop ' + index);
				var cards = inFoot ? $scope.players[0].footCards : $scope.players[0].handCards;
				var startCard = cards.indexOf(obj);
				cards.move(startCard, index);
				player.resetHighlight($scope.players[0], $scope);
				if ($scope.control.turnState !== 'play')
					player.sendUpdate($scope);
			}
			
			// click on one of the pick up piles
			$scope.clickPile = function(pileIndex, inFoot) {
				$scope.message = false;
				if (!$scope.players[0].turn)
					return;
				switch ($scope.control.turnState) {
					case 'draw1':
						$scope.control.turnState = 'draw2'
						break;
					case 'draw2':
						$scope.control.turnState = 'play'
						break;
					case 'draw3':
						if (--$scope.control.drawCards <= 0)
							$scope.control.turnState = 'play'
						break;
					default:
						$scope.message = "Cards are already drawn.";
						return;
				}
					
				var cards = inFoot ? $scope.players[0].footCards : $scope.players[0].handCards;
				cards.push($scope.piles[pileIndex].cards.pop());
				player.resetHighlight($scope.players[0], $scope);
				player.sendUpdate($scope);
				player.clearUndo($scope);
			};
			
			// click on the discard pile
			$scope.clickDiscardPile = function(inFoot) {
				console.log('pile discard click');
				$scope.message = false;
				if (!$scope.players[0].turn)
					return;

				switch ($scope.control.turnState) {
					case 'draw1':
						$scope.message = player.canDrawFromDiscard($scope);
						if ($scope.message)
							return;

						player.updateUndo($scope);
						// set the topCard in scope to the top card from the pile
						// do not draw the 7 cards until the meld (or melds) have been played
						$scope.drawFromDiscard.topCard = $scope.piles[4].cards[$scope.piles[4].cards.length - 1];
						$scope.drawFromDiscard.topCard.highlight = true;
						if ($scope.players[0].inFoot)
							$scope.players[0].footCards.push($scope.drawFromDiscard.topCard);
						else
							$scope.players[0].handCards.push($scope.drawFromDiscard.topCard);
						$scope.control.turnState = 'play';
						break;
					case 'play':
						// cannot discard if not finished draw from pile
						if ($scope.drawFromDiscard.topCard) {
							$scope.message = "You must play the card from the discard pile in a meld.";
							return;
						}
							
						// must have one card selected to discard
						var selectedCards = player.highlightedCards($scope.players[0]);
						if (selectedCards.length !== 1) {
							$scope.message = "Select one card to discard.";
							return;
						}
						
						// must be in a valid state to end turn
						$scope.message = player.canEndTurn($scope, selectedCards[0], melds);
						if ($scope.message)
							return;
						
						// discard the selected card and end the turn or the hand
						var cards = inFoot ? $scope.players[0].footCards : $scope.players[0].handCards;
						var cardIndex = cards.indexOf(selectedCards[0]);
						$scope.piles[4].cards.push(selectedCards[0]);
						cards.splice(cardIndex, 1);
						player.resetHighlight($scope.players[0], $scope);
						
						// check if the hand is over 
						// - discarding the last card from the foot
						// - and there is at least one clean and one dirty
						if ($scope.players[0].inFoot
						&& cards.length === 0
						&& $scope.teams[0].counts[1].count > 0
						&& $scope.teams[0].counts[2].count > 0)
							$scope.control.turnState = 'endHand';
						else
							$scope.control.turnState = 'end';
						player.sendUpdate($scope);
						player.clearUndo($scope);
						break;
				}
			};
			
			// click on the meld base to start a new meld
			$scope.clickMeldBase = function() {
				console.log('pile meld base');
				
				player.updateUndo($scope);
				
				$scope.message = melds.clickMeld(false, $scope);
				if ($scope.message) {
					$scope.undo.pop();
					return;
				}
				
				// playing without cards
				if ($scope.players[0].inFoot && $scope.players[0].footCards.length === 0) {
					$scope.control.turnState = 'end';
					player.sendUpdate($scope);
					player.clearUndo($scope);
					return;
				}
			};
			
			// click on the meld to add cards
			$scope.clickMeld = function(event, meld) {
				event.preventDefault();
				event.stopPropagation();

				console.log('click meld');

				player.updateUndo($scope);

				$scope.message = melds.clickMeld(meld, $scope);
				if ($scope.message) {
					$scope.undo.pop();
					return;
				}
					
				// playing without cards
				if ($scope.players[0].inFoot && $scope.players[0].footCards.length === 0) {
					$scope.control.turnState = 'end';
					player.sendUpdate($scope);
					player.clearUndo($scope);
					return;
				}
			};

			$scope.applyUndo = function() {
				console.log('click undo');
				player.applyUndo($scope);
			};

			$scope.resign = function() {
			};

			$scope.sendChat = function() {
				console.log('send chat');

				if ($scope.chatLine === '')
					return;
				player.sendChat($scope.chatLine);
				$scope.chatLine= '';
			};
		}
	]);