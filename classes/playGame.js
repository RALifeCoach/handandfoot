<<<<<<< HEAD
'use strict';

var ConnectedGame = function(pGameId) {
	this.gameId = pGameId;
	this.sockets = [];
}
ConnectedGame.prototype.sendMessages = function(gameVM, receiveSocket, showResults) {
	var playersVM = [];
	for (var playerIndex = 0; playerIndex < gameVM.players.length; playerIndex++) {
		if (gameVM.players[playerIndex].personOffset === -1)
			playersVM.push({ 
				turn: false, 
				person: false, 
				position: gameVM.players[playerIndex].position 
			});
		else
			playersVM.push(gameVM.players[playerIndex]);
	}
	gameVM.players = [];

	var teamsVM = [];
	for (var teamIndex = 0; teamIndex < gameVM.teams.length; teamIndex++)
		teamsVM.push(gameVM.teams[teamIndex]);
	gameVM.teams = [];
	
	// create player objects used to send basic information (no card details)
	var otherPlayers = [];
	for (var playerIndex = 0; playerIndex < playersVM.length; playerIndex++) {
		var playerVM = playersVM[playerIndex];
		playerVM.myUpdate = false;
		if (!playerVM.person)
			otherPlayers.push({ 
				turn: false, 
				person: false, 
				inFoot: false, 
				position: playerVM.position,
				myUpdate: false });
		else {
			otherPlayers.push({
				person: playerVM.person,
				position: playerVM.position,
				turn: false,
				inFoot: playerVM.inFoot,
				footCards: playerVM.footCards.length,
				handCards: playerVM.handCards.length,
				myUpdate: false
			});
		}
	}

	playersVM[gameVM.turn].turn = true;
	otherPlayers[gameVM.turn].turn = true;
	
	if (this.sockets.length > gameVM.numberOfPlayers) {
		console.log('too many sockets', this.sockets.length);
		console.log(this.sockets);
	}
	
	// send update game with players and teams properly ordered
	for (var socketIndex = 0; socketIndex < this.sockets.length; socketIndex++) {
		var socket = this.sockets[socketIndex];

		// assemble players
		var players = [];
		for (var playerIndex = 0; playerIndex < playersVM.length; playerIndex++) {
			var socketPlayerIndex = playerIndex + socket.position;
			if (socketPlayerIndex >= playersVM.length)
				socketPlayerIndex -= playersVM.length;
			
			if (playerIndex === 0) {
				playersVM[socketPlayerIndex].myUpdate = receiveSocket == socket.socket;
				players.push(playersVM[socketPlayerIndex]);
			} else {
				players.push(otherPlayers[socketPlayerIndex]);
			}
		}
		
		// assemble teams
		var teams = [];
		var teamPosition = socket.position % teamsVM.length;
		for (var teamIndex = 0; teamIndex < teamsVM.length; teamIndex++) {
			var socketTeamIndex = teamIndex + teamPosition;
			if (socketTeamIndex >= teamsVM.length)
				socketTeamIndex -= teamsVM.length;
			teams.push(teamsVM[socketTeamIndex]);
		}
		
		// if the hand ended, send the results
		if (showResults) {
			var results = [];
			for (var teamIndex = 0; teamIndex < teamsVM.length; teamIndex++) {
				results.push(teams[teamIndex].results.splice(-1)[0]);
			}
			socket.emit('handResults', resultsVM);
		}

		// send the new data to each player
		socket.socket.emit('gameUpdate', { game: gameVM, players: players, teams: teams });
	}
};
=======
>>>>>>> 71f6637e0b0f73d09a53e39d956d371b6594648c

function PlayGame() {
	this.connectedPlayers = [];
	this.connectedGames = [];
}

PlayGame.prototype.leaveGame = function(socket, mapper) {
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
		var playerIndex = _this.connectedPlayers.indexOf(connectedPlayer);
		_this.connectedPlayers.splice(playerIndex, 1);
		
		// if it's the last player then remove the game
		if (connectedGame.sockets.length === 1) {
			var gameIndex = _this.connectedGames.indexOf(connectedGame);
			_this.connectedGames.splice(gameIndex, 1);
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

PlayGame.prototype.newConnectedPlayer = function(socket, data) {
	// check to see if the player is already playing a game
	for (var playerIndex = 0; playerIndex < this.connectedPlayers.length; playerIndex++) {
		if (this.connectedPlayers[playerIndex].personId.toString() === data.personId.toString()) {
			console.log('player already playing');
			
			this.connectedPlayers.splice(playerIndex, 1);
			break;
		}
	}
				
	// add the new player to the list of players
	this.connectedPlayers.push({ 
		personId: data.personId, 
		position: data.position, 
		personName: data.name,
		socketId: socket.id, 
		gameId: data.gameId});
	return true;
};

PlayGame.prototype.findCreateConnectedGame = function(socket, data) {
	// find the game, create if it doesn't exist
	var connectedGame = false;
	for (var gameIndex = 0; gameIndex < this.connectedGames.length; gameIndex++) {
		if (this.connectedGames[gameIndex].gameId.toString() === data.gameId.toString()) {
			connectedGame = this.connectedGames[gameIndex];
			break;
		}
	}
	
	// in no connected game found then create one
	if (!connectedGame) {
		var connectedGame = new ConnectedGame(data.gameId);
		this.connectedGames.push(connectedGame);
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

PlayGame.prototype.findConnectedPlayer = function(socket) {
	// check to see if the player is playing a game
	var connectedPlayer = false;
	for (var playerIndex = 0; playerIndex < this.connectedPlayers.length; playerIndex++) {
		if (this.connectedPlayers[playerIndex].socketId.toString() === socket.id.toString()) {
			connectedPlayer = this.connectedPlayers[playerIndex];
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
	
PlayGame.prototype.findConnectedGame = function(socket, gameId) {
	// find the game, error if it doesn't exist
	var connectedGame = false;
	for (var gameIndex = 0; gameIndex < this.connectedGames.length; gameIndex++) {
		if (this.connectedGames[gameIndex].gameId.toString() === gameId.toString()) {
			connectedGame = this.connectedGames[gameIndex];
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
PlayGame.prototype.sendEndHandQuestion = function(socket) {
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
PlayGame.prototype.sendEndHandResponse = function(socket, data) {
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
PlayGame.prototype.sendResignRequest = function(socket) {
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
PlayGame.prototype.endTheGame = function(socket, mapper, wasResigned) {
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
	
PlayGame.prototype.sendResignNoResponse = function(socket) {
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

module.exports.PlayGame = PlayGame;
