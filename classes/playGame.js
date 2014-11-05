var ConnectedGame = function(pGameId) {
	this.gameId = pGameId;
	this.sockets = [];
}
ConnectedGame.prototype.sendMessages = function(gameVM) {
	var playersVM = [];
	
	for (playerIndex in gameVM.players) {
		if (!gameVM.players[playerIndex])
			playersVM.push({ turn: false, person: false });
		else
			playersVM.push(gameVM.players[playerIndex]);
	}
	gameVM.players = [];

	var teamsVM = [ gameVM.nsTeam, gameVM.ewTeam ];
	gameVM.nsTeam = false;
	gameVM.ewTeam = false;
	
	// create player objects used to send basic information (no card details)
	var otherPlayers = [];
	for (playerIndex in playersVM) {
		var playerVM = playersVM[playerIndex];
		if (!playerVM.person)
			otherPlayers.push({ turn: false, person: false, inFoot: false });
		else {
			otherPlayers.push({
				person: playerVM.person,
				direction: playerVM.direction,
				turn: false,
				inFoot: playerVM.inFoot,
				footCards: playerVM.footCards.length,
				handCards: playerVM.handCards.length
			});
		}
	}

	playersVM[gameVM.turn].turn = true;
	otherPlayers[gameVM.turn].turn = true;

	// send update game with players properly ordered
	for (socketIndex in this.sockets) {
		var socket = this.sockets[socketIndex];
		var players = [];
		var teams = [];
		
		switch (socket.direction) {
			case 'North':
				players.push(playersVM[0]);
				players.push(otherPlayers[1]);
				players.push(otherPlayers[2]);
				players.push(otherPlayers[3]);
				teams.push(teamsVM[0]);
				teams.push(teamsVM[1]);
				break;
			case 'East':
				players.push(playersVM[1]);
				players.push(otherPlayers[2]);
				players.push(otherPlayers[3]);
				players.push(otherPlayers[0]);
				teams.push(teamsVM[1]);
				teams.push(teamsVM[0]);
				break;
			case 'South':
				players.push(playersVM[2]);
				players.push(otherPlayers[3]);
				players.push(otherPlayers[0]);
				players.push(otherPlayers[1]);
				teams.push(teamsVM[0]);
				teams.push(teamsVM[1]);
				break;
			case 'West':
				players.push(playersVM[3]);
				players.push(otherPlayers[0]);
				players.push(otherPlayers[1]);
				players.push(otherPlayers[2]);
				teams.push(teamsVM[1]);
				teams.push(teamsVM[0]);
				break;
		}
		
		// send the new data to each player
		socket.socket.emit('gameUpdate', { game: gameVM, players: players, teams: teams });
	}
};

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
			connectedGame.sendMessages(gameVM);
		}
	});
};

PlayGame.prototype.newConnectedPlayer = function(socket, data) {
	// check to see if the player is already playing a game
	for (var playerIndex = 0; playerIndex < this.connectedPlayers.length; playerIndex++) {
		if (this.connectedPlayers[playerIndex].personId.toString() === data.personId.toString()) {
			console.log(this.connectedPlayers[playerIndex]);
			console.log('player already playing');
			socket.emit('joinError', { error: 'Player already playing a game' });
			return false;
		}
	}
				
	// add the new player to the list of players
	this.connectedPlayers.push({ 
		personId: data.personId, 
		direction: data.direction, 
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
	if (!connectedGame) {
		var connectedGame = new ConnectedGame(data.gameId);
		this.connectedGames.push(connectedGame);
	}
	
	// add the socket to the game - for sending
	connectedGame.sockets.push({ direction: data.direction, socket: socket} );
	
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
		socket.emit('updateError', { error: 'Player not playing a game' });
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
		socket.emit('updateError', { error: 'Game not found' });
		return;
	}

	return connectedGame;
};
	
PlayGame.prototype.sendResignRequest = function(socket, gameId) {
	var _this = this;
	// common routine for leaving the game
	// check to see if the player is playing a game
	var connectedPlayer = this.findConnectedPlayer(socket);
	if (!connectedPlayer)
		return;
	
	// find the game, error if it doesn't exist
	var connectedGame = _this.findConnectedGame(socket, connectedPlayer.gameId);
	if (!connectedGame)
		return;

	// send update game with players properly ordered
	for (socketIndex in this.sockets) {
		var socket = this.sockets[socketIndex];
		
		// send the resign request to each player
		socket.socket.emit('resignRequest', { direction: connectedPlayer.direction });
	}
};

module.exports.PlayGame = PlayGame;
