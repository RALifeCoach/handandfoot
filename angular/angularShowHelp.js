// factory for play game view
Array.prototype.move = function(fromIndex, toIndex) {
	var element = this[fromIndex];
	this.splice(fromIndex, 1);
	this.splice(toIndex, 0, element);
};

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

