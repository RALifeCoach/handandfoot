'use strict';

module.exports = function(pPlayGameBL, mapper, io) {
	var playGameBL = pPlayGameBL;
	var connectedPlayers = [];
	var connectedGames = [];

	var playGame = {};

	// message handler for join game message
	playGame.joinGame = function(socket, data) {
		playGameBL.newConnectedPlayer(socket, data);

		// add the player to the game and game VM
		mapper.addPlayer(data.gameId, 'person', data.personId, data.position, function(err, gameVM) {
			if (err) {
				return; 
			}
					
			var connectedGame = playGameBL.findCreateConnectedGame(data);
			if (!connectedGame)
				return;

			connectedGame.addPlayer(socket, data);
			
			io.sockets.emit('refreshGames');

			// send the message
			connectedGame.sendMessages(gameVM, socket.id);
		});
	};

	// message handler for join game message
	playGame.joinGameAsRobot = function(data) {
		var robotId = data.gameId + 'p' + data.position;
		playGameBL.newConnectedRobot(robotId, data);

		// add the player to the game and game VM
		mapper.addPlayer(data.gameId, 'robot', robotId, data.position, function(err, gameVM) {
			if (err) {
				return; 
			}

			var connectedGame = playGameBL.findCreateConnectedGame(data);
			if (!connectedGame)
				return;

			connectedGame.addRobot(data);

			io.sockets.emit('refreshGames');

			// send the message
			connectedGame.sendMessages(gameVM, robotId);
		});
	};

	playGame.sendChatMessage = function(receiveId, data) {
		var connectedPlayer = playGameBL.findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		var connectedGame = playGameBL.findConnectedGame(receiveId, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendChatMessage({chatText: connectedPlayer.personName + ": " + data.chat});
	};

	// message handler for messages from the game
	playGame.receiveGameMessage = function (receiveId, data) {
		var connectedPlayer = playGameBL.findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		var connectedGame = playGameBL.findConnectedGame(receiveId, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendChatMessage({ chatText: "Game: " + data.message });
	};

	// message handler for the leave game message
	playGame.leaveGame = function(receiveId) {
		// this is moved to a common method because it is also performed in 'disconnect'
		playGameBL.leaveGame(receiveId);
	};

	// message handler for the leave game message
	playGame.resignRequest = function(receiveId) {
		playGameBL.sendResignRequest(receiveId);
	};

	// message handler for the leave game message
	playGame.resignResponse = function (receiveId, data) {
		// end the game
		if (data.result === 'yes') {
			return playGameBL.endTheGame(receiveId, true);
		}
			
		playGameBL.sendResignNoResponse(receiveId);
	};

	// message handler for the end hand question
	playGame.endHandQuestion = function(receiveId) {
		playGameBL.sendEndHandQuestion(receiveId);
	};

	// message handler for the end hand question
	playGame.endHandResponse = function(receiveId, data) {
		playGameBL.sendEndHandResponse(receiveId, data);
	};
	
	// message handler for update cards message
	playGame.updateGame = function(receiveId, data) {
		var connectedPlayer = playGameBL.findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
				
		// update the game and, optionally, the game VM
		mapper.updateGame(
			connectedPlayer.gameId, 
			data.player, 
			data.melds, 
			data.redThrees, 
			data.action, 
			data.control, 
			function(err, gameVM, showResults) {
				if (err) {
					console.log(err);
					console.log(data.gameId);
					return; 
				}
				
				// game view model is only returned if the update affects other player displays
				if (gameVM) {
					// the game is over
					if (gameVM.gameComplete) {
						playGameBL.endTheGame(receiveId, false);
					} else {
						// find the game, error if it doesn't exist
						var connectedGame = playGameBL.findConnectedGame(receiveId, connectedPlayer.gameId);
						if (!connectedGame)
							return;
						
						// send the updates to the other players
						connectedGame.sendMessages(gameVM, receiveId, showResults);
					}
				}
			}
		);
	};
	
	// message handler for disconnect
	playGame.leaveGame = function(receiveId) {
		playGameBL.leaveGame(receiveId);
	};	
	
	return playGame;
};
