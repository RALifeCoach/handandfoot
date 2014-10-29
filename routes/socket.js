var GameVM = require('./../viewModels/GameVM');

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
		
		// remove players from the game
		socket.socket.emit('gameUpdate', { game: gameVM, players: players, teams: teams });
	}
};
function Socket(io) {
	var connectedPlayers = [];
	var connectedGames = [];

	io.on('connection', function (socket) {
		// message handler for join game message
		socket.on('joinGame', function (data) {
			console.log('recieved join:', JSON.stringify(data));

			// check to see if the player is already playing a game
			for (playerIndex in connectedPlayers) {
				if (connectedPlayers[playerIndex].personId.toString() === data.personId.toString()) {
					console.log(connectedPlayers[playerIndex]);
					console.log('player already playing');
					socket.emit('joinError', { error: 'Player already playing a game' });
					return;
				}
			}

			// add the player to the game and game VM
			var mapper = new GameVM();
			mapper.addPlayer(data.gameId, data.personId, data.direction, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(data.gameId);
					return; 
				}
				
				// find the game, create if it doesn't exist
				var connectedGame = false;
				for (gameIndex in connectedGames) {
					if (connectedGames[gameIndex].gameId.toString() === gameVM._id.toString()) {
						connectedGame = connectedGames[gameIndex];
						break;
					}
				}
				if (!connectedGame) {
					var connectedGame = new ConnectedGame(gameVM._id);
					connectedGames.push(connectedGame);
				}
				
				// add the socket to the game - for sending
				connectedGame.sockets.push({ direction: data.direction, socket: socket} );
				
				// add the new player to the list of players
				connectedPlayers.push({ personId: data.personId, socketId: socket.id, gameId: gameVM._id});
	
				// if the game has 4 players then begin the game
				if (gameVM.playersFull && !gameVM.gameBegun) {
					mapper.startNewGame(data.gameId, function(err, gameVM) {
						if (err) {
							console.log(err);
							console.log(data.gameId);
							return; 
						}
						
						// send the message
						connectedGame.sendMessages(gameVM);
					});
				} else {
					// send the message
					connectedGame.sendMessages(gameVM);
				}
			});
		});

		// message handler for the leave game message
		socket.on('leaveGame', function () {
			console.log('recieved leave game');

			// this is moved to a common method because it is also performed in 'disconnect'
			leaveGame(socket);
		});

		// message handler for update cards message
		socket.on('updateGame', function (data) {
			console.log('recieved update Cards');

			// check to see if the player is playing a game
			var connectedPlayer = false;
			for (playerIndex in connectedPlayers) {
				if (connectedPlayers[playerIndex].socketId.toString() === socket.id.toString()) {
					connectedPlayer = connectedPlayers[playerIndex];
					break;
				}
			}
			if (!connectedPlayer) {
				console.log('player not playing');
				socket.emit('updateError', { error: 'Player not playing a game' });
				return;
			}
					
			// update the game and, optionally, the game VM
			var mapper = new GameVM();
			mapper.updateGame(connectedPlayer.gameId, data.player, data.piles, data.melds, data.turnState, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(data.gameId);
					return; 
				}
				
				// game view model is only returned if the update affects other player displays
				if (gameVM) {
					// find the game, error if it doesn't exist
					var connectedGame = false;
					for (gameIndex in connectedGames) {
						if (connectedGames[gameIndex].gameId.toString() === connectedPlayer.gameId.toString()) {
							connectedGame = connectedGames[gameIndex];
							break;
						}
					}
					if (!connectedGame) {
						console.log('game not found');
						socket.emit('updateError', { error: 'Game not found' });
						return;
					}
					
					// send the updates to the other players
					connectedGame.sendMessages(gameVM);
				}
			});
		});
		
		// message handler for disconnect
		socket.on('disconnect', function () {
			console.log('recieved disconnect');

			leaveGame(socket);
		});	

		// common routine for leaving the game
		function leaveGame(socket) {
			// check to see if the player is playing a game
			var connectedPlayer = false;
			for (playerIndex in connectedPlayers) {
				if (connectedPlayers[playerIndex].socketId.toString() === socket.id.toString()) {
					connectedPlayer = connectedPlayers[playerIndex];
					connectedPlayers.splice(playerIndex, 1);
					break;
				}
			}
			if (!connectedPlayer) {
				console.log('player not playing');
				socket.emit('leaveError', { error: 'Player not playing a game' });
				return;
			}
			
			// add the player and socket to the game VM
			var mapper = new GameVM();
			mapper.removePlayer(connectedPlayer.gameId, connectedPlayer.personId, function(err, gameVM) {
				if (err) {
					console.log(err);
					console.log(connectedPlayer);
					return; 
				}
				
				// find the game, error if it doesn't exist
				var connectedGame = false;
				for (gameIndex in connectedGames) {
					if (connectedGames[gameIndex].gameId.toString() === connectedPlayer.gameId.toString()) {
						connectedGame = connectedGames[gameIndex];
						break;
					}
				}
				if (!connectedGame) {
					console.log('game not found');
					socket.emit('leaveError', { error: 'Game not found' });
					return;
				}
				
				// if it's the last player then remove the game
				if (connectedGame.sockets.length < 2) {
					connectedGames.splice(gameIndex, 1);
				} else {
					// remove the socket
					for (socketIndex in connectedGame.sockets) {
						if (connectedGame.sockets[socketIndex] === socket.id) {
							connectedGame.sockets.splice(socketIndex, 1);
							break;
						}
					}
					
					// send the message to the remaining players
					connectedGame.sendMessages(gameVM);
				}
			});
		}
	});
};

module.exports = Socket;
