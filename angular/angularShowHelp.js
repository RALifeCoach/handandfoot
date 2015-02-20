'use strict';

angular.module('handAndFoot')
	.factory('helpFactory', ['$http', 
		'showHelpService',
		'$sce',
		function($http, showHelpService, $sce){
			var showHelp = { 
				helpText: ''
			};
			
			// join game message
			showHelp.showHelp = function() {
				var modalOptions = {
					closeButtonText: 'Close',
					actionButtonText: false,
					headerText: 'How to Play',
					modalText: showHelp.helpText
				};

				if (showHelp.helpText === '') {
					return $http.get('/games/getHelp').success(function(data){
						showHelp.helpText = $sce.trustAsHtml(data.helpText.join(""));

						modalOptions.modalText = showHelp.helpText;
						showHelpService.showModal({}, modalOptions);
					});
				}

				showHelpService.showModal({}, modalOptions);
			}
		
			return showHelp;
		}
	]);

