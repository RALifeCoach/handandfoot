angular.module('handAndFoot')
	.service('hintsService', ['$modal',
		'$cookieStore',
		function($modal, $cookieStore){
			var modalDefaults = {
				backdrop: true,
				keyboard: true,
				modalFade: true,
				templateUrl: '/partials/hints.html'
			};

			var modalOptions = {
				actionButtonText: 'Ok',
				headerText: 'Game Hints'
			};

			this.showModal = function (customModalDefaults, customModalOptions, hints) {
				if (!customModalDefaults) customModalDefaults = {};
				customModalDefaults.backdrop = 'static';
				return this.show(customModalDefaults, customModalOptions, hints);
			};

			this.show = function (hints) {
				modalOptions.hints = hints;
				modalOptions.hintIndex = Math.floor(Math.random() * hints.length) + 1;
				modalOptions.stopHints = false;

				if (!modalDefaults.controller) {
					modalDefaults.controller = function ($scope, $modalInstance) {
						$scope.modalOptions = modalOptions;
						$scope.modalOptions.nextHint = function () {
							if (++$scope.modalOptions.hintIndex === $scope.modalOptions.hints.length)
								$scope.modalOptions.hintIndex = 0;
						}
						$scope.modalOptions.ok = function (result) {
							if ($scope.modalOptions.stopHints) {
								$cookieStore.put('StopHints', true);
							}
							$modalInstance.dismiss();
						};
					}
				}

				return $modal.open(modalDefaults).result;
			};
		}
	]);
