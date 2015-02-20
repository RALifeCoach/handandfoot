'use strict';

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
		'helpFactory',
		'addGameService',
		'sharedProperties',
		'gamePasswordService',
		'hintsService',
		'chatSocket',
		'playGame',
		function($scope, $location, $cookieStore, games, helpFactory, addGameService, sharedProperties, gamePasswordService, hintsService, chatSocket, playGame){
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

			// listen for game update message
			$scope.$on('socket:refreshGames', function(event) {
				console.log('game update');
				
				games.getAll( {personId: $scope.person._id} );
			});

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

			$scope.showHelp = function() {
				console.log('show help');
				helpFactory.showHelp();
			};
			
			// add a new game
			$scope.addGame = function() {
				addGameService.showModal(function(game) {
					games.create({ personId: $scope.person._id, game: game });
				});
			};

			// join an existing game
			$scope.joinGame = function(game, position, existingPlayer) {
				console.log('join game ' + position);
				if (!existingPlayer && game.password && game.password !== '') {
					// show the model to get the password
					var modalOptions = {
						closeButtonText: 'Cancel',
						actionButtonText: 'Continue',
						headerText: 'Enter the game password'
					};

					gamePasswordService.showModal({}, modalOptions, game.password).then(function (result) {
						sharedProperties.setGameId(game._id);
						sharedProperties.setPosition(position);

						$location.path('/play');
					});
				} else {
					sharedProperties.setGameId(game._id);
					sharedProperties.setPosition(position);

					$location.path("/play");
				}
			};

			// join a game as Robot
			$scope.joinAsRobot = function(game, position) {
				console.log('join game robot ' + position);
				if (game.password && game.password !== '') {
					// show the model to get the password
					var modalOptions = {
						closeButtonText: 'Cancel',
						actionButtonText: 'Continue',
						headerText: 'Enter the game password'
					};

					gamePasswordService.showModal({}, modalOptions, game.password).then(function (result) {
						playGame.joinGameAsRobot()
					});
				} else {
					playGame.joinGameAsRobot()
				}
			};
		}
	]);