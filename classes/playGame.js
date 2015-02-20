'use strict';
var ConnectedGame = require('./connectedGame');

module.exports = function(pMapper) {
	var mapper = pMapper;
	var connectedPlayers = [];
	var connectedGames = [];

	var playGame = {};

	playGame.leaveGame = function(socket) {
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
			var playerIndex = connectedPlayers.indexOf(connectedPlayer);
			connectedPlayers.splice(playerIndex, 1);

			// if it's the last player then remove the game
			if (connectedGame.removePlayer(socket, gameVM)) {
				var gameIndex = connectedGames.indexOf(connectedGame);
				connectedGames.splice(gameIndex, 1);
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
		}
		
		// add the socket to the game - for sending
		connectedGame.addPlayer(data.position, socket);
		
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

		connectedGame.sendEndHandQuestion(connectedPlayer);
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

		connectedGame.sendEndHandResponse(data);
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

		connectedGame.sendResignRequest(connectedPlayer);
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

		connectedGame.sendResignNoResponse();
	};

	// end the game
	playGame.endTheGame = function(socket, wasResigned) {
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
			connectedGame.sendResignYesResponse(resignedTeam, winningTeam);
		});
	};
	
	return playGame;
};
