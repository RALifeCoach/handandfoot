'use strict';

var mongoose = require('mongoose');
var Robot = mongoose.model('Robot');
var events = require('events');
var eventHandler = events.EventEmitter();

module.exports = function(gameId, position) {
	var id = gameId + 'p' + position;
	var robotPlayer = {
	};
	
	robotPlayer.emit = function(messageType, data) {
		Robot.findById(id, function(err, robot) {
			if (err) {
				console.log('error fetching robot: ' + id);
				console.log(err);
				return;
			}
			// process the message
			switch (messageType) {
				case 'gameUpdate':
					gameUpdate(data, robot, id);
					break;
				case 'chatUpdate':
					chatUpdate(data, robot);
					break;
				case 'endHandQuestion':
					endHandQuestion(robot);
					break;
				case 'endHandResponse':
					endHandResponse(data, robot);
					break;
				case 'resignRequest':
					resignRequest(robot);
					break;
				case 'resignResponse':
					resignResponse(data, robot);
					break;
				default:
					ggggg = ooooo;
			}
		});
	};
	
	return robotPlayer;
	
	function gameUpdate(data, robot, id) {
		console.log('robot game update');
console.log(data.players);
		
		// update robot information - if it doesn't exist then create it
		if (!robot) {
			robot = {
				_id: id
			};
		}
		
		robot.position = data.players[0].position;
		robot.handCards = data.players[0].footCards;
		robot.footCards = data.players[0].handCards;
		robot.melds = data.teams[0].melds;
		robot.score = data.teams[0].score;
	}
	
	function chatUpdate(data, robot) {
		console.log('robot chat update');
console.log(data);
	}
};