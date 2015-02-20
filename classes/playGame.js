'use strict';

module.export = function PlayGame() {
	var connectedPlayers = [];
	var connectedGames = [];

	var playGame = {};

	playGame.leaveGame = function(socket, mapper) {
		var _this = this;
		// common routine for leaving the game
		// check to see if the player is playing a game
		var connectedPlayer = this.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		// add the player and socket to the game VM
		mapper.removePlayer(connectedPlayer.gameId, connectedPlayer.personId, function(err, gameVM) {
			if (err) {
				console.log(err);
				console.log(connectedPlayer);
				return; 
			}
			
			// find the game, error if it doesn't exist
			var connectedGame = _this.findConnectedGame(socket, connectedPlayer.gameId);
			if (!connectedGame)
				return;
			
			// remove player from connected players
			var playerIndex = _connectedPlayers.indexOf(connectedPlayer);
			_connectedPlayers.splice(playerIndex, 1);
			
			// if it's the last player then remove the game
			if (connectedGame.sockets.length === 1) {
				var gameIndex = _connectedGames.indexOf(connectedGame);
				_connectedGames.splice(gameIndex, 1);
			} else {
				// remove the socket
				for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
					if (connectedGame.sockets[socketIndex] === socket.id) {
						connectedGame.sockets.splice(socketIndex, 1);
						break;
					}
				}
				
				// send the message to the remaining players
				connectedGame.sendMessages(gameVM, socket);
			}
		});
	};

	playGame.newConnectedPlayer = function(socket, data) {
		// check to see if the player is already playing a game
		for (var playerIndex = 0; playerIndex < connectedPlayers.length; playerIndex++) {
			if (connectedPlayers[playerIndex].personId.toString() === data.personId.toString()) {
				console.log('player already playing');
				
				connectedPlayers.splice(playerIndex, 1);
				break;
			}
		}
					
		// add the new player to the list of players
		connectedPlayers.push({ 
			personId: data.personId, 
			position: data.position, 
			personName: data.name,
			socketId: socket.id, 
			gameId: data.gameId});
		return true;
	};

	playGame.findCreateConnectedGame = function(socket, data) {
		// find the game, create if it doesn't exist
		var connectedGame = false;
		for (var gameIndex = 0; gameIndex < connectedGames.length; gameIndex++) {
			if (connectedGames[gameIndex].gameId.toString() === data.gameId.toString()) {
				connectedGame = connectedGames[gameIndex];
				break;
			}
		}
		
		// in no connected game found then create one
		if (!connectedGame) {
			var connectedGame = new ConnectedGame(data.gameId);
			connectedGames.push(connectedGame);
		} else {
			// in case the socket already exists for this position - remove it
			for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
				if (connectedGame.sockets[socketIndex].position === data.position) {
					connectedGame.sockets.splice(socketIndex, 1);
					break;
				}
			}
		}
		
		// add the socket to the game - for sending
		connectedGame.sockets.push({ position: data.position, socket: socket} );
		
		return connectedGame;
	};

	playGame.findConnectedPlayer = function(socket) {
		// check to see if the player is playing a game
		var connectedPlayer = false;
		for (var playerIndex = 0; playerIndex < connectedPlayers.length; playerIndex++) {
			if (connectedPlayers[playerIndex].socketId.toString() === socket.id.toString()) {
				connectedPlayer = connectedPlayers[playerIndex];
				break;
			}
		}
		if (!connectedPlayer) {
			console.log('player not playing');
			//socket.emit('error', { error: 'Player not playing a game' });
			return false;
		}

		return connectedPlayer;
	};
		
	playGame.findConnectedGame = function(socket, gameId) {
		// find the game, error if it doesn't exist
		var connectedGame = false;
		for (var gameIndex = 0; gameIndex < connectedGames.length; gameIndex++) {
			if (connectedGames[gameIndex].gameId.toString() === gameId.toString()) {
				connectedGame = connectedGames[gameIndex];
				break;
			}
		}
		if (!connectedGame) {
			console.log('game not found');
			socket.emit('error', { error: 'Game not found' });
			return;
		}

		return connectedGame;
	};

	// received end hand question - send it to all players
	playGame.sendEndHandQuestion = function(socket) {
		// check to see if the player is playing a game
		var connectedPlayer = this.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		// send to each player
		for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
			var socket = connectedGame.sockets[socketIndex].socket;
			
			socket.emit('endHandQuestion', { position: connectedPlayer.position, personName: connectedPlayer.personName });
		}
	};

	// received end hand question - send it to all players
	playGame.sendEndHandResponse = function(socket, data) {
		// check to see if the player is playing a game
		var connectedPlayer = this.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		// send to each player
		for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
			var socket = connectedGame.sockets[socketIndex].socket;
			
			socket.emit('endHandResponse', data);
		}
	};

	// received a request to resign - send it to all players
	playGame.sendResignRequest = function(socket) {
		// check to see if the player is playing a game
		var connectedPlayer = this.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		// send to each player
		for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
			var socket = connectedGame.sockets[socketIndex].socket;
			
			socket.emit('resignRequest', { position: connectedPlayer.position, personName: connectedPlayer.personName });
		}
	};

	// end the game
	playGame.endTheGame = function(socket, mapper, wasResigned) {
		var _this = this;
		// find the player, error if not found
		var connectedPlayer = this.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;

		// get the resigned team and winning team
		var resignPosition = wasResigned ? connectedPlayer.position : false;
		var resignedTeam = false;
		if (resignPosition !== false)
			resignedTeam = _this.getTeam(game, resignPosition);
		var winningTeam = false;
		for (var teamIndex = 0; teamIndex < game.teams.length; teamIndex++) {
			var gameTeam = games.teams[teamIndex];
			if (gameTeam != resignedTeam) {
				if (!winningTeam)
					winningTeam = gameTeam;
				else if (winningTeam.score < gameTeam.score)
					winningTeam = gameTeam;
			}
		}
		
		// end the game
		mapper.endGame(connectedPlayer.gameId, resignTeam, winningTeam, function(err, game) {
			if (err)
				return;
				
			// find the game, error if it doesn't exist
			var connectedGame = _this.findConnectedGame(socket, connectedPlayer.gameId);
			if (!connectedGame)
				return;

			// send the resign response
			for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
				var socket = connectedGame.sockets[socketIndex].socket;
				var position = connectedGame.sockets[socketIndex].position;

				var teamGame = _this.getTeam(game, position);
				var status = 'loss';
				if (gameTeam == resignedTeam)
					status = 'resigned';
				else if (gameTeam == winningTeam)
					status = 'win';
				
				// send the resign response to each player
				socket.emit('resignResponse', { result: status });
			}
		});
	};
		
	playGame.sendResignNoResponse = function(socket) {
		// find the player, error if not found
		var connectedPlayer = this.findConnectedPlayer(socket);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		// send the resign response
		for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
			var socket = connectedGame.sockets[socketIndex].socket;
			
			// send the resign response to each player
			console.log('send resign response');
			socket.emit('resignResponse', { result: 'no'} );
		}
	};
};
