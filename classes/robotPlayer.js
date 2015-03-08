'use strict';
var robotMain = require('./robotMain');

module.exports = function(gameId, position, pEventHandler) {
	var id = gameId + 'p' + position;
	var eventHandler = pEventHandler;
	var robotPlayer = {
	};
	
	robotPlayer.emit = function(messageType, data) {
		robotMain.getRobot(id, function(err, robot) {
			if (err) {
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
	
	function gameUpdate(data, pRobot, id) {
		console.log('robot game update');
		
		robotMain.updateRobot(data, pRobot, id, function(err, robot) {
			if (err) {
				return;
			}

			// if it's the robot's turn then play
			if (robot.control.turn && data.game.gameBegun)
				playTurn(robot);
		});
	}
	
	// it's the robot's turn
	function playTurn(robot) {
		console.log('play turn', robot.control.turnState);
		var action = false;
		switch (robot.control.turnState) {
			case 'draw1':
				action = robotMain.drawACard(robot);
				break;
			case 'draw2':
			case 'draw3':
				action = robotMain.drawFromPile(robot);
				break;
			case 'play':
				action = robotMain.playCards(robot);
				break;
		}
		
		sendUpdate(robot, action);
	}

	// received chat
	function chatUpdate(data, robot) {
		console.log('robot chat update');
console.log(data);
	}

	// send an update to the server
	function sendUpdate(robot, action) {
		if (!action)
			action = false;
			
		var data = {
			id: robot._id,
			player: robot.player,
			melds: robot.melds,
			redThrees: robot.redThrees,
			action: action,
			control: robot.control
		};
		data.player.person = {
			name: robot.player.name
		};
console.log('send update', action, robot.control);
		eventHandler.emit('updateGame', data);
		
		for (var messageIndex = 0; messageIndex < robot.gameMessages.length; messageIndex++)
			eventHandler.emit('gameMessage', { message: robot.gameMessages[messageIndex] });
		robot.gameMessages = [];
	};
};