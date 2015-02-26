'use strict';
var events = require('events');
var eventHandler = new events.EventEmitter();

function Play(io, playGame) {
	io.on('connection', function (socket) {
		console.log('play connection');
		// message handler for join game message
		socket.on('joinGame', function (data) {
			console.log('received join');

			playGame.joinGame(socket, data);
		});

		// message handler for join game message
		socket.on('joinGameAsRobot', function (data) {
			console.log('received join as robot');

			playGame.joinGameAsRobot(data);
		});

		// message handler for the chat message
		socket.on('sendChat', function (data) {
			console.log('recieved chat');

			playGame.sendChatMessage(socket.id, data);
		});

		// message handler for messages from the game
		socket.on('gameMessage', function (data) {
			console.log('recieved game message');

			playGame.receiveGameMessage(socket.id, data);
		});

		// message handler for the leave game message
		socket.on('leaveGame', function () {
			console.log('recieved leave game');

			playGame.leaveGame(socket.id);
		});

		// message handler for the leave game message
		socket.on('resignRequest', function () {
			console.log('recieved resign request');

			playGame.sendResignRequest(socket.id);
		});

		// message handler for the leave game message
		socket.on('resignResponse', function (data) {
			console.log('recieved resign response');
				
			playGame.sendResignResponse(socket.id, data);
		});

		// message handler for the end hand question
		socket.on('endHandQuestion', function () {
			console.log('recieved end hand question');

			playGame.sendEndHandQuestion(socket.id);
		});

		// message handler for the end hand question
		socket.on('endHandResponse', function (data) {
			console.log('recieved end hand response');
				
			playGame.sendEndHandResponse(socket.id, data);
		});
		
		// message handler for update cards message
		socket.on('updateGame', function (data) {
			console.log('recieved update Cards');

			playGame.updateGame(socket.id, data);
		});
		
		// message handler for disconnect
		socket.on('disconnect', function () {
			console.log('recieved disconnect');

			playGame.leaveGame(socket.id);
		});	
	});

	// process messages from robot
	eventHandler.on('sendChat', function(robotId, data) {
		console.log('recieved chat');

		playGame.sendChatMessage(robotId, data);
	});

	// message handler for messages from the game
	eventHandler.on('gameMessage', function(data) {
		console.log('recieved game message');

		playGame.receiveGameMessage(robotId, data);
	});

	// message handler for the leave game message
	eventHandler.on('leaveGame', function() {
		console.log('recieved leave game');

		playGame.leaveGame(robotId);
	});

	// message handler for the leave game message
	eventHandler.on('resignRequest', function() {
		console.log('recieved resign request');

		playGame.sendResignRequest(robotId);
	});

	// message handler for the leave game message
	eventHandler.on('resignResponse', function(data) {
		console.log('recieved resign response');
			
		playGame.sendResignResponse(robotId, data);
	});

	// message handler for the end hand question
	eventHandler.on('endHandQuestion', function() {
		console.log('recieved end hand question');

		playGame.sendEndHandQuestion(robotId);
	});

	// message handler for the end hand question
	eventHandler.on('endHandResponse', function(data) {
		console.log('recieved end hand response');
			
		playGame.sendEndHandResponse(robotId, data);
	});
	
	// message handler for update cards message
	eventHandler.on('updateGame', function(data) {
		console.log('recieved update Cards');

		playGame.updateGame(robotId, data);
	});
	
	// message handler for disconnect
	eventHandler.on('disconnect', function() {
		console.log('recieved disconnect');

		playGame.leaveGame(robotId);
	});	
};

module.exports = Play;
