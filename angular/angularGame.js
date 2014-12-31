angular.module('handAndFoot')
	.factory('gameFactory', ['$http', 
		function($http){
			var o = {
				games: [],
				hints: []
			};
			
			// get all games
			o.getAll = function(data) {
				return $http.post('/games/getAll', data).success(function(data){
					angular.copy(data, o.games);
				});
			};
			
			// get all hints
			o.getHints = function(callback) {
				return $http.get('/games/getHints').success(function(data){
					angular.copy(data, o.hints);
					callback();
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
		'$cookieStore',
		'gameFactory',
		'sharedProperties',
		'gamePasswordService',
		'hintsService',
		function($scope, $location, $cookieStore, games, sharedProperties, gamePasswordService, hintsService){
			// if user not set then go to login
			$scope.person = sharedProperties.getPerson();
			$scope.games = [];
			if (!$scope.person) {
				$location.path('/login');
				return;
			}
			// get all games awaiting players
			games.getAll( {personId: $scope.person._id} );
			$scope.games = games.games;

			$scope.$on('$routeChangeSuccess', function () {
				// get all games awaiting players
				games.getAll( {personId: $scope.person._id} );
				$scope.games = games.games;
			});			

			var stopHints = $cookieStore.get('StopHints');
			if (!stopHints) {
				games.getHints(function() {
					hintsService.showModal(games.hints);
				});
			}
			
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
			$scope.joinGame = function(game, direction, existingPlayer) {
				if (!existingPlayer && game.password && game.password !== '') {
					// show the model to get the password
					var modalOptions = {
						closeButtonText: 'Cancel',
						actionButtonText: 'Continue',
						headerText: 'Enter the game password'
					};

					gamePasswordService.showModal({}, modalOptions, game.password).then(function (result) {
						sharedProperties.setGameId(game._id);
						sharedProperties.setDirection(direction);

						$location.path('/play');
					});
				} else {
					sharedProperties.setGameId(game._id);
					sharedProperties.setDirection(direction);

					$location.path("/play");
				}
			};
		}
	]);