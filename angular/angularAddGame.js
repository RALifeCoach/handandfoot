angular.module('handAndFoot')
	.service('addGameService', ['$modal',
		function($modal){
			var modalDefaults = {
				backdrop: true,
				keyboard: true,
				modalFade: true,
				templateUrl: '/partials/addGame.html'
			};
			
			this.showModal = function (callback) {
				modalDefaults.controller = function ($scope, $modalInstance) {
					$scope.name= "";
					$scope.password = "";

					$scope.ok = function () {
						if ($scope.event_form.$valid) {
							callback({
								name: $scope.name
								, password: $scope.password
							});
							$modalInstance.close();
						}
					};
					$scope.close = function () {
						$modalInstance.dismiss('cancel');
					};
				};

				return $modal.open(modalDefaults).result;
			};
		}
	]);
