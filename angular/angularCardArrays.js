'use strict';

angular.module('handAndFoot')
	.factory('cardArrays', ['playGame',
		function(playGame){
			var base = { 
				redThrees: [],
				blackThrees: [],
				wildCards: [],
				suits: [
					{ suit: 'Clubs', cards: []},
					{ suit: 'Diamonds', cards: []},
					{ suit: 'Hearts', cards: []},
					{ suit: 'Spades', cards: []}
				],
				numbers: [],
				suitCount: 0,
				meldSuit: -1,
				numberCount: 0,
				meldNumber: -1,
				selectedCards: []
			};
			
			// fill in the arrays
			base.buildCardArrays = function(player) {
				// initialize counters and arrays
				this.redThrees = [];
				this.blackThrees = []
				this.wildCards = [];
				this.suits = [
					{ suit: 'Clubs', cards: []},
					{ suit: 'Diamonds', cards: []},
					{ suit: 'Hearts', cards: []},
					{ suit: 'Spades', cards: []}
				];
				this.numbers = [];
				this.suitCount = 0;
				this.meldSuit = -1;
				this.numberCount = 0;
				this.meldNumber = -1;
				for (var index = 0; index < 13; index++)
					this.numbers.push({ number: index, cards: []});

				this.selectedCards = playGame.highlightedCards(player);
				
				for (var cardIndex = 0; cardIndex < this.selectedCards.length; cardIndex++) {
					var card = this.selectedCards[cardIndex];
					if (playGame.isRedThree(card))
						this.redThrees.push(card);
					else if (playGame.isBlackThree(card))
						this.blackThrees.push(card);
					else if (playGame.isWildCard(card))
						this.wildCards.push(card);
					else {
						if (this.suits[card.suitNumber].cards.length === 0)
							this.suitCount++;
						this.suits[card.suitNumber].cards.push(card);
						this.meldSuit = card.suitNumber;
						
						if (this.numbers[card.cardNumber].cards.length === 0)
							this.numberCount++
						this.numbers[card.cardNumber].cards.push(card);
						this.meldNumber = card.cardNumber;
					}
				}
			}
			return base;
		}
	]);
