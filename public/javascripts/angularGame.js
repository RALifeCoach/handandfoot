angular.module('handAndFoot')
	.factory('games', ['$http', 
		function($http){
			var o = {
				games: []
			};
			
			// get all games
			o.getAll = function(data) {
				return $http.post('/games/getAll', data).success(function(data){
					angular.copy(data, o.games);
				});
			};
			
			// create a new game
			o.create = function(game) {
				return $http.post('/games', game).success(function(data){
					o.games.push(data);
				});
			};
			
			return o;
		}
	]);

angular.module('handAndFoot')
	.controller('GameCtrl', [
		'$scope',
		'$location',
		'games',
		'sharedProperties',
		function($scope, $location, games, sharedProperties){
			// if user not set then go to login
			$scope.person = sharedProperties.getPerson();
			if (!$scope.person) {
				$location.path('/login');
				return;
			}
			
			// get all games awaiting players
			games.getAll( {personId: $scope.person._id} );
			$scope.games = games.games;

			// add a new game
			$scope.addGame = function() {
				if ($scope.name === '') 
					return;
				games.create({
					name: $scope.name,
					password: $scope.password
				});
				$scope.name = '';
				$scope.password = '';
			};

			// join an existing game
			$scope.joinGame = function(gameId, direction) {
				sharedProperties.setGameId(gameId);
				sharedProperties.setDirection(direction);

				$location.path("/play");
			};
		}
	]);