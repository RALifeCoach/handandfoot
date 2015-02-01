var ConnectedGame = function(pGameId) {
	this.gameId = pGameId;
	this.sockets = [];
}
ConnectedGame.prototype.sendMessages = function(gameVM, receiveSocket, results) {
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
	
	var nsResults = gameVM.results.nsResults;
	var ewResults = gameVM.results.ewResults;
	gameVM.results = false;
	var resultsVM = [];
	
	// create player objects used to send basic information (no card details)
	var otherPlayers = [];
	for (playerIndex in playersVM) {
		var playerVM = playersVM[playerIndex];
		playerVM.myUpdate = false;
		if (!playerVM.person)
			otherPlayers.push({ turn: false, person: false, inFoot: false, myUpdate: false });
		else {
			otherPlayers.push({
				person: playerVM.person,
				direction: playerVM.direction,
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
	
	if (this.sockets.length > 4) {
		console.log('too many sockets', this.sockets.length);
		console.log(this.sockets);
	}
	
	// send update game with players properly ordered
	for (socketIndex in this.sockets) {
		var socket = this.sockets[socketIndex].socket;
		var players = [];
		var teams = [];
		
		switch (this.sockets[socketIndex].direction) {
			case 'North':
				playersVM[0].myUpdate = receiveSocket == socket;
				players.push(playersVM[0]);
				players.push(otherPlayers[1]);
				players.push(otherPlayers[2]);
				players.push(otherPlayers[3]);
				teams.push(teamsVM[0]);
				teams.push(teamsVM[1]);
				resultsVM.push(nsResults);
				resultsVM.push(ewResults);
				break;
			case 'East':
				playersVM[1].myUpdate = receiveSocket == socket;
				players.push(playersVM[1]);
				players.push(otherPlayers[2]);
				players.push(otherPlayers[3]);
				players.push(otherPlayers[0]);
				teams.push(teamsVM[1]);
				teams.push(teamsVM[0]);
				resultsVM.push(ewResults);
				resultsVM.push(nsResults);
				break;
			case 'South':
				playersVM[2].myUpdate = receiveSocket == socket;
				players.push(playersVM[2]);
				players.push(otherPlayers[3]);
				players.push(otherPlayers[0]);
				players.push(otherPlayers[1]);
				teams.push(teamsVM[0]);
				teams.push(teamsVM[1]);
				resultsVM.push(nsResults);
				resultsVM.push(ewResults);
				break;
			case 'West':
				playersVM[3].myUpdate = receiveSocket == socket;
				players.push(playersVM[3]);
				players.push(otherPlayers[0]);
				players.push(otherPlayers[1]);
				players.push(otherPlayers[2]);
				teams.push(teamsVM[1]);
				teams.push(teamsVM[0]);
				resultsVM.push(ewResults);
				resultsVM.push(nsResults);
				break;
		}
		
		// if the hand ended, send the results
		if (results)
			socket.emit('handResults', resultsVM);
			
		// send the new data to each player
		socket.emit('gameUpdate', { game: gameVM, players: players, teams: teams, results: resultsVM });
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
			connectedGame.sendMessages(gameVM, socket);
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
		// in case the socket already exists for this direction - remove it
		for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
			if (connectedGame.sockets[socketIndex].direction === data.direction) {
				connectedGame.sockets.splice(socketIndex, 1);
				break;
			}
		}
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
		
		socket.emit('endHandQuestion', { direction: connectedPlayer.direction, personName: connectedPlayer.personName });
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
		
		socket.emit('resignRequest', { direction: connectedPlayer.direction, personName: connectedPlayer.personName });
	}
};
	
PlayGame.prototype.endTheGame = function(socket, mapper, wasResigned) {
	var _this = this;
	// find the player, error if not found
	var connectedPlayer = this.findConnectedPlayer(socket);
	if (!connectedPlayer)
		return;
	
	var personId = wasResigned ? connectedPlayer.personId : false;
	mapper.endGame(connectedPlayer.gameId, personId, function(err, game) {
		if (err)
			return;
			
		// find the game, error if it doesn't exist
		var connectedGame = _this.findConnectedGame(socket, connectedPlayer.gameId);
		if (!connectedGame)
			return;

		// send the resign response
		for (var socketIndex = 0; socketIndex < connectedGame.sockets.length; socketIndex++) {
			var socket = connectedGame.sockets[socketIndex].socket;
			var direction = connectedGame.sockets[socketIndex].direction;
			var results = 'loser';
			switch (direction) {
				case 'North':
				case 'South':
					if (wasResigned
					&& (connectedPlayer.direction === 'East' || connectedPlayer.direction === 'West'))
						results = 'winner';
					if (game.nsTeam[0].score > game.ewTeam[0].score)
						results = 'winner';
					break;
				case 'East':
				case 'West':
					if (wasResigned
					&& (connectedPlayer.direction === 'North' || connectedPlayer.direction === 'South'))
						results = 'winner';
					if (game.nsTeam[0].score < game.ewTeam[0].score)
						results = 'winner';
					break;
			}
			
			// send the resign response to each player
			socket.emit('resignResponse', { result: results });
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
