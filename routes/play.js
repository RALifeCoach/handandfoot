function Play(io, playGame, mapper) {
	io.on('connection', function (socket) {
		console.log('play connection');
		// message handler for the chat message
		socket.on('sendChat', function (data) {
			console.log('recieved chat');

			var connectedPlayer = playGame.findConnectedPlayer(socket);
			if (!connectedPlayer)
				return;
			
			var connectedGame = playGame.findConnectedGame(socket, connectedPlayer.gameId);
			if (!connectedGame)
				return;

			// send update game with players properly ordered
			for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
				var connection = connectedGame.sockets[socketIndex];
		
				// send the new data to each player
				var text = connectedPlayer.personName + ": " + data.chat;
				connection.socket.emit('chatUpdate', { chatText: text });
			}
		});

		// message handler for messages from the game
		socket.on('gameMessage', function (data) {
			console.log('recieved game message');

			var connectedPlayer = playGame.findConnectedPlayer(socket);
			if (!connectedPlayer)
				return;
			
			var connectedGame = playGame.findConnectedGame(socket, connectedPlayer.gameId);
			if (!connectedGame)
				return;

			// send update game with players properly ordered
			for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
				var connection = connectedGame.sockets[socketIndex];
		
				// send the new data to each player
				var text = "Game: " + data.message;
				connection.socket.emit('chatUpdate', { chatText: text });
			}
		});

		// message handler for join game message
		socket.on('joinGame', function (data) {
			console.log('recieved join');

			if (!playGame.newConnectedPlayer(socket, data))
				return;

			// add the player to the game and game VM
			mapper.addPlayer(data.gameId, data.personId, data.direction, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(data.gameId);
					return; 
				}
						
				var connectedGame = playGame.findCreateConnectedGame(socket, data);
				if (!connectedGame)
					return;

				io.sockets.emit('refreshGames');
	
				// if the game has 4 players then begin the game
				if (gameVM.playersFull && !gameVM.gameBegun) {
					mapper.startNewGame(data.gameId, function(err, gameVM) {
						if (err) {
							console.log(err);
							console.log(data.gameId);
							return; 
						}
							
						// send the message
						connectedGame.sendMessages(gameVM, socket);
					});
				} else {
					// send the message
					connectedGame.sendMessages(gameVM, socket);
				}
			});
		});

		// message handler for the leave game message
		socket.on('leaveGame', function () {
			console.log('recieved leave game');

			// this is moved to a common method because it is also performed in 'disconnect'
			playGame.leaveGame(socket, mapper);
		});

		// message handler for the leave game message
		socket.on('resignRequest', function () {
			console.log('recieved resign request');

			playGame.sendResignRequest(socket);
		});

		// message handler for the leave game message
		socket.on('resignResponse', function (data) {
			console.log('recieved resign response');

			// end the game
			if (data.result === 'yes') {
				return playGame.endTheGame(socket, mapper, true);
			}
				
			playGame.sendResignNoResponse(socket);
		});

		// message handler for the end hand question
		socket.on('endHandQuestion', function () {
			console.log('recieved end hand question');

			playGame.sendEndHandQuestion(socket);
		});

		// message handler for the end hand question
		socket.on('endHandResponse', function (data) {
			console.log('recieved end hand response');
				
			playGame.sendEndHandResponse(socket, data);
		});
		
		// message handler for update cards message
		socket.on('updateGame', function (data) {
			console.log('recieved update Cards');

			var connectedPlayer = playGame.findConnectedPlayer(socket);
			if (!connectedPlayer)
				return;
					
			// update the game and, optionally, the game VM
			mapper.updateGame(connectedPlayer.gameId, data.player, data.piles, data.melds, data.action, data.control, function(err, gameVM, results) {
				if (err) {
					console.log(err);
					console.log(data.gameId);
					return; 
				}
				
				// game view model is only returned if the update affects other player displays
				if (gameVM) {
					// the game is over
					if (gameVM.gameComplete) {
						playGame.endTheGame(socket, mapper, false);
					} else {
						// find the game, error if it doesn't exist
						var connectedGame = playGame.findConnectedGame(socket, connectedPlayer.gameId);
						if (!connectedGame)
							return;
						
						// send the updates to the other players
						connectedGame.sendMessages(gameVM, socket, results);
					}
				}
			});
		});
		
		// message handler for disconnect
		socket.on('disconnect', function () {
			console.log('recieved disconnect');

			playGame.leaveGame(socket, mapper);
		});	
	});
};

module.exports = Play;
