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
					
			var connectedGame = playGameBL.findCreateConnectedGame(socket, data);
			if (!connectedGame)
				return;

			io.sockets.emit('refreshGames');

			// send the message
			connectedGame.sendMessages(gameVM, socket);
		});
	};

	// message handler for join game message
	playGame.joinGameAsRobot = function(socket, data) {
		playGameBL.newConnectedPlayer(data.gameId + 'p' + data.position, data);

		// add the player to the game and game VM
		mapper.addPlayer(data.gameId, 'robot', data.gameId + 'p' + data.position, data.position, function(err, gameVM) {
			if (err) {
				return; 
			}
					
			var connectedGame = playGameBL.findCreateConnectedGame(socket, data);
			if (!connectedGame)
				return;

			io.sockets.emit('refreshGames');

			// send the message
			connectedGame.sendMessages(gameVM, socket);
		});
	};

	playGame.sendChatMessage = function(socket, data) {
		var connectedPlayer = playGameBL.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		var connectedGame = playGameBL.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendChatMessage({chatText: connectedPlayer.personName + ": " + data.chat});
	};

	// message handler for messages from the game
	playGame.receiveGameMessage = function (socket, data) {
		var connectedPlayer = playGameBL.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		var connectedGame = playGameBL.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendChatMessage({ chatText: "Game: " + data.message });
	};

	// message handler for the leave game message
	playGame.leaveGame = function(socket) {
		// this is moved to a common method because it is also performed in 'disconnect'
		playGameBL.leaveGame(socket);
	};

	// message handler for the leave game message
	playGame.resignRequest = function(socket) {
		playGameBL.sendResignRequest(socket);
	};

	// message handler for the leave game message
	playGame.resignResponse = function (socket, data) {
		// end the game
		if (data.result === 'yes') {
			return playGameBL.endTheGame(socket, true);
		}
			
		playGameBL.sendResignNoResponse(socket);
	};

	// message handler for the end hand question
	playGame.endHandQuestion = function(socket) {
		playGameBL.sendEndHandQuestion(socket);
	};

	// message handler for the end hand question
	playGame.endHandResponse = function(socket, data) {
		playGameBL.sendEndHandResponse(socket, data);
	};
	
	// message handler for update cards message
	playGame.updateGame = function(socket, data) {
		var connectedPlayer = playGameBL.findConnectedPlayer(socket);
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
						playGameBL.endTheGame(socket, false);
					} else {
						// find the game, error if it doesn't exist
						var connectedGame = playGameBL.findConnectedGame(socket, connectedPlayer.gameId);
						if (!connectedGame)
							return;
						
						// send the updates to the other players
						connectedGame.sendMessages(gameVM, socket, showResults);
					}
				}
			}
		);
	};
	
	// message handler for disconnect
	playGame.leaveGame = function(socket) {
		playGameBL.leaveGame(socket);
	};	
	
	return playGame;
};
