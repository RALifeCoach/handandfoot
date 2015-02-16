angular.module('handAndFoot', ['ui.router', 
	'ngCookies', 
	'btford.socket-io', 
	'ngDraggable', 
	'ui.bootstrap',
	'ngAudio',
	'ngLoadingSpinner']);

// add config to hand the various page states
angular.module('handAndFoot')
	.config(
		function($stateProvider, $urlRouterProvider) {
			$stateProvider
				.state('login', {
					url: '/login',
					templateUrl: '/partials/login.html',
					controller: 'AuthenticateCtrl'
				})
				.state('register', {
					url: '/register',
					templateUrl: '/partials/register.html',
					controller: 'AuthenticateCtrl'
				})
				.state('game', {
					url: '/games',
					templateUrl: '/partials/games.html',
					controller: 'GameCtrl'
				})
				.state('play', {
					url: '/play',
					templateUrl: '/partials/play.html',
					controller: 'PlayCtrl'
				});

			$urlRouterProvider.otherwise('login');
		}
	);

// shared properties - save person and games between configurations
angular.module('handAndFoot')
	.service('sharedProperties', [
		'$cookieStore',
		function($cookieStore) {
			var sharedGameId = false;
			var sharedPerson = false;
			var sharedPosition = false;
			return { 
				getGameId: function() { 
					if (!sharedGameId) {
						sharedGameId = $cookieStore.get('gameId');
					}
					return sharedGameId; 
				},
				setGameId: function(gameId) { 
					sharedGameId = gameId; 
					$cookieStore.put('gameId', gameId);
				},
				getPerson: function() { 
					if (!sharedPerson) {
						sharedPerson = $cookieStore.get('person');
					}
					return sharedPerson; 
				},
				setPerson: function(person) { 
					sharedPerson = person; 
					if (person === null)
						$cookieStore.remove('person');
					else
						$cookieStore.put('person', person);
				},
				getPosition: function() { 
					if (!sharedPosition) {
						sharedPosition = $cookieStore.get('position');
					}
					return sharedPosition; 
				},
				setPosition: function(position) { 
					sharedPosition = position; 
					$cookieStore.put('position', position);
				}
			};
		}
	]);
	
// chat socket factory
angular.module('handAndFoot')
	.factory('chatSocket', ['socketFactory',
		function (socketFactory) {
			var playSocket = socketFactory();
			playSocket.forward('gameUpdate');
			playSocket.forward('chatUpdate');
			playSocket.forward('resignRequest');
			playSocket.forward('resignResponse');
			playSocket.forward('endHandQuestion');
			playSocket.forward('endHandResponse');
			playSocket.forward('handResults');
			playSocket.forward('refreshGames');
			playSocket.forward('error');
			return playSocket;
		}
	]);

// session - set debugger
angular.module('handAndFoot')
	.factory('SessionService', function($q, $http) {
		var service = {
			user_id: null,
			getCurrentUser: function() {
				debugger; // Set the debugger inside 
						// this function
				return service.user_id;
			}
		}
		return service;
	});
angular.module('handAndFoot')
	.filter('maxCards', function() {
        return function(input) {
			var max = input[0] > 10 ? 10 : input[0];
            var result = [];
            for (var i = 0; i < max; i++)
                result.push(i);
            return result;
        };
    });
angular.module('handAndFoot')
	.filter('maxDiscard', function() {
        return function(inPile) {
			if (!inPile)
				return;
			
			var max = inPile.length > 10 ? 10 : inPile.length;
            var result = [];
            for (cardIndex = inPile.length - max; cardIndex < inPile.length; cardIndex++)
                result.push(inPile[cardIndex]);
            return result;
        };
    });
angular.module('handAndFoot')
	.filter('inProgress', function() {
        return function(melds) {
            var result = [];
            for (var meldIndex = 0; meldIndex < melds.length; meldIndex++)
				if (!melds[meldIndex].isComplete)
					result.push(melds[meldIndex]);

			return result;
        };
    });
angular.module('handAndFoot')
	.directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    });
angular.module('handAndFoot')
	.directive('playingCard', [
		'$compile',
		function($compile) {
			var linker = function(scope, element, attrs) {
				scope.$watch('card', function() {
					var highlight = attrs.hasOwnProperty('highlight')
						? 'ng-drag="true" ng-drag-data="card"'
						: '';
					var suit = '';
					var rank = '';
					var cardClass = attrs.hasOwnProperty('highlight') && scope.card.highlight ? 'highlight ' : '';
					var title = '';
					switch (scope.card.suitNumber) {
						case 4:
							rank = '-';
							suit = 'Joker';
							cardClass += 'card little joker';
							title = 'Joker';
							break;
						case 0:
							suit = '&clubs;';
							rank = scope.card.number;
							cardClass += 'card rank-' + scope.card.number + ' ' + scope.card.suitCard;
							title = scope.card.number + ' of ' + scope.card.suitCard;
							break;
						case 1:
							suit = '&diams;';
							rank = scope.card.number;
							cardClass += 'card rank-' + scope.card.number + ' ' + scope.card.suitCard;
							title = scope.card.number + ' of ' + scope.card.suitCard;
							break;
						case 2:
							suit = '&hearts;';
							rank = scope.card.number;
							cardClass += 'card rank-' + scope.card.number + ' ' + scope.card.suitCard;
							title = scope.card.number + ' of ' + scope.card.suitCard;
							break;
						case 3:
							suit = '&spades;';
							rank = scope.card.number;
							cardClass += 'card rank-' + scope.card.number + ' ' + scope.card.suitCard;
							title = scope.card.number + ' of ' + scope.card.suitCard;
							break;
					}
					var htmlText = '<div class="' + cardClass + '" ' + highlight + ' title="' + title + '">\n' +
						'<span class="rank">' + rank + '</span>\n' +
						'<span class="suit">' + suit + '</span>\n' +
						'</div>';
					element.html(htmlText);
					$compile(element.contents())(scope);
				}, true);
			};
		
			return {
				restrict: 'E',
				scope: {
					card: '='
				},
				link: linker
			};
		}
	]);
