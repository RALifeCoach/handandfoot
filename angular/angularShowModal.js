angular.module('handAndFoot')
	.service('showModalService', [
		'$modal',
		function($modal){
			var modalInstance = {};
			var modalDefaults = {
				backdrop: true,
				keyboard: true,
				modalFade: true,
				templateUrl: '/partials/showModal.html'
			};

			var modalOptions = {
				closeButtonText: 'Cancel',
				actionButtonText: 'Continue',
				headerText: 'Header'
			};

			this.showModal = function (customModalDefaults, customModalOptions) {
				if (!customModalDefaults) customModalDefaults = {};
				customModalDefaults.backdrop = 'static';
				return this.show(customModalDefaults, customModalOptions);
			};

			this.show = function (customModalDefaults, customModalOptions) {
				//Create temp objects to work with since we're in a singleton service
				var tempModalDefaults = {};
				var tempModalOptions = {};

				//Map angular-ui modal custom defaults to modal defaults defined in service
				angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

				//Map modal.html $scope custom properties to defaults defined in service
				angular.extend(tempModalOptions, modalOptions, customModalOptions);

				if (!tempModalDefaults.controller) {
					tempModalDefaults.controller = function ($scope, $modalInstance) {
						modalInstance = $modalInstance;
						$scope.modalOptions = tempModalOptions;
						$scope.modalOptions.ok = function () {
							$modalInstance.close({result: 'yes'});
						};
						$scope.modalOptions.close = function () {
							$modalInstance.close({result: 'no'});
						};
					}
				}

				return $modal.open(tempModalDefaults).result;
			};

			this.closeModal = function () {
				modalInstance.close({result: 'close'});
			};
		}
	]);
