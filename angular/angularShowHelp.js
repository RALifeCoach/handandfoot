// factory for play game view
Array.prototype.move = function(fromIndex, toIndex) {
	var element = this[fromIndex];
	this.splice(fromIndex, 1);
	this.splice(toIndex, 0, element);
};

angular.module('handAndFoot')
	.factory('helpFactory', ['$http', 
		'showModalService',
		function($http, showModalService){
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
						showHelp.helpText = data.helpText;

						modalOptions.modalText = showHelp.helpText;
						showModalService.showModal({}, modalOptions);
					});
				}

				showModalService.showModal({}, modalOptions);
			}
		
			return showHelp;
		}
	]);

