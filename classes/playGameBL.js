'use strict';
var ConnectedGame = require('./connectedGame');

module.exports = function(pMapper) {
	var mapper = pMapper;
	var connectedPlayers = [];
	var connectedGames = [];

	var playGameBL = {};

	playGameBL.leaveGame = function(receiveId) {
		var _this = this;
		// common routine for leaving the game
		// check to see if the player is playing a game
		var connectedPlayer = findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		// add the player to the game VM
		mapper.removePlayer(connectedPlayer.gameId, connectedPlayer.personId, function(err, gameVM) {
			if (err) {
				console.log(err);
				console.log(connectedPlayer);
				return; 
			}
			
			// find the game, error if it doesn't exist
			var connectedGame = findConnectedGame(connectedPlayer.gameId);
			if (!connectedGame)
				return;
			
			// remove player from connected players
			var playerIndex = connectedPlayers.indexOf(connectedPlayer);
			connectedPlayers.splice(playerIndex, 1);

			// if it's the last player then remove the game
			if (connectedGame.removePlayer(receiveId, gameVM)) {
				var gameIndex = connectedGames.indexOf(connectedGame);
				connectedGames.splice(gameIndex, 1);
			}
		});
	};

	playGameBL.newConnectedPlayer = function(socket, data) {
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
			type: 'player',
			socket: socket, 
			gameId: data.gameId});
	};

	playGameBL.newConnectedRobot = function(robotId, data) {
		// check to see if the player is already playing a game
		for (var playerIndex = 0; playerIndex < connectedPlayers.length; playerIndex++) {
			if (connectedPlayers[playerIndex].robotId === robotId) {
				console.log('player already playing');
				
				connectedPlayers.splice(playerIndex, 1);
				break;
			}
		}
					
		// add the new player to the list of players
		connectedPlayers.push({ 
			position: data.position, 
			personName: 'Robot' + data.position,
			type: 'robot',
			robotId: robotId, 
			gameId: data.gameId});
	};

	playGameBL.findCreateConnectedGame = function(data) {
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
		
		return connectedGame;
	};

	function findConnectedPlayer(receiveId) {
		// look for socket or robot
			
		// check to see if the player is playing a game
		var connectedPlayer = false;
		for (var playerIndex = 0; playerIndex < connectedPlayers.length; playerIndex++) {
			var player = connectedPlayers[playerIndex];
			if (player.type === 'person' && player.socket.id.toString() === receiveId) {
				connectedPlayer = connectedPlayers[playerIndex];
				break;
			}
			if (player.type === 'robot' && player.robotId === receiveId) {
				connectedPlayer = connectedPlayers[playerIndex];
				break;
			}
		}
		if (!connectedPlayer) {
			console.log('player not playing');
			return false;
		}

		return connectedPlayer;
	};
		
	function findConnectedGame(gameId) {
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
			return false;
		}

		return connectedGame;
	};

	// received end hand question - send it to all players
	playGameBL.sendEndHandQuestion = function(receiveId) {
		// check to see if the player is playing a game
		var connectedPlayer = findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = findConnectedGame(connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendEndHandQuestion(connectedPlayer);
	};

	// received end hand question - send it to all players
	playGameBL.sendEndHandResponse = function(receiveId, data) {
		// check to see if the player is playing a game
		var connectedPlayer = findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = findConnectedGame(connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendEndHandResponse(data);
	};

	// received a request to resign - send it to all players
	playGameBL.sendResignRequest = function(receiveId) {
		// check to see if the player is playing a game
		var connectedPlayer = findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = findConnectedGame(connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendResignRequest(connectedPlayer);
	};
		
	playGameBL.sendResignNoResponse = function(receiveId) {
		// find the player, error if not found
		var connectedPlayer = findConnectedPlayer(receiveId);
		if (!connectedPlayer)
			return;
		
		// find the game, error if it doesn't exist
		var connectedGame = findConnectedGame(connectedPlayer.gameId);
		if (!connectedGame)
			return;

		connectedGame.sendResignNoResponse();
	};

	// end the game
	playGameBL.endTheGame = function(receiveId, wasResigned) {
		var _this = this;
		// find the player, error if not found
		var connectedPlayer = findConnectedPlayer(receiveId);
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
			var connectedGame = findConnectedGame(connectedPlayer.gameId);
			if (!connectedGame)
				return;

			// send the resign response
			connectedGame.sendResignYesResponse(resignedTeam, winningTeam);
		});
	};
	
	return playGameBL;
};
