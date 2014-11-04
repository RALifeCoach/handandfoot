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
				$scope.control.hasMelds = false;
				for (var meldIndex = 0; meldIndex < data.teams[0].melds.length; meldIndex++) {
					if (data.teams[0].meldstype !== 'Red Three') {
						$scope.control.hasMelds = true;
						break;
					}
				}
				$scope.control.drawCards = data.game.drawCards;
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
			$scope.clickDiscardPile = function(event, inFoot) {
				event.preventDefault();
				event.stopPropagation();

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

			$scope.sortByNumber = function() {
				console.log('sort by number');
				$scope.message = false;

				melds.sortByNumber($scope.players[0]);

				player.resetHighlight($scope.players[0], $scope);
				if ($scope.control.turnState !== 'play')
					player.sendUpdate($scope);
			};

			$scope.sortBySuit = function() {
				console.log('sort by suit');
				$scope.message = false;

				melds.sortBySuit($scope.players[0]);

				player.resetHighlight($scope.players[0], $scope);
				if ($scope.control.turnState !== 'play')
					player.sendUpdate($scope);
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