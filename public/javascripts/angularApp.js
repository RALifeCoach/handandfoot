angular.module('handAndFoot', ['ui.router', 'ngCookies', 'btford.socket-io', 'ngDraggable', 'ui.bootstrap']);

// add config to hand the various page states
angular.module('handAndFoot')
	.config(
		function($stateProvider, $urlRouterProvider) {
			$stateProvider
				.state('login', {
					url: '/login',
					templateUrl: '/login.html',
					controller: 'AuthenticateCtrl'
				})
				.state('register', {
					url: '/register',
					templateUrl: '/register.html',
					controller: 'AuthenticateCtrl'
				})
				.state('game', {
					url: '/games',
					templateUrl: '/games.html',
					controller: 'GameCtrl'
				})
				.state('play', {
					url: '/play',
					templateUrl: '/play.html',
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
			var sharedDirection = false;
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
				getDirection: function() { 
					if (!sharedDirection) {
						sharedDirection = $cookieStore.get('direction');
					}
					return sharedDirection; 
				},
				setDirection: function(direction) { 
					sharedDirection = direction; 
					$cookieStore.put('direction', direction);
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
            for (var i = 0; i <= max; i++)
                result.push(i);
            return result;
        };
    });
angular.module('handAndFoot')
	.filter('maxDiscard', function() {
        return function(inPile) {
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