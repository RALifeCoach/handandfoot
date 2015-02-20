'use strict';

angular.module('handAndFoot')
	.service('gamePasswordService', ['$modal',
		function($modal){
			var modalDefaults = {
				backdrop: true,
				keyboard: true,
				modalFade: true,
				templateUrl: '/partials/gamePassword.html'
			};

			var modalOptions = {
				closeButtonText: 'Cancel',
				actionButtonText: 'Continue',
				headerText: 'Game Password'
			};

			this.showModal = function (customModalDefaults, customModalOptions, password) {
				if (!customModalDefaults) customModalDefaults = {};
				customModalDefaults.backdrop = 'static';
				return this.show(customModalDefaults, customModalOptions, password);
			};

			this.show = function (customModalDefaults, customModalOptions, password) {
				//Create temp objects to work with since we're in a singleton service
				var tempModalDefaults = {};
				var tempModalOptions = {};

				//Map angular-ui modal custom defaults to modal defaults defined in service
				angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

				//Map modal.html $scope custom properties to defaults defined in service
				angular.extend(tempModalOptions, modalOptions, customModalOptions);

				if (!tempModalDefaults.controller) {
					tempModalDefaults.controller = function ($scope, $modalInstance) {
						$scope.modalOptions = tempModalOptions;
						$scope.modalOptions.ok = function (result) {
							if ($scope.gamePassword === password) {
								$modalInstance.close(result);
							}
						};
						$scope.modalOptions.close = function (result) {
							$modalInstance.dismiss('cancel');
						};
					}
				}

				return $modal.open(tempModalDefaults).result;
			};
		}
	]);
