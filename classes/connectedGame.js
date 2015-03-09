﻿'use strict';

var events = require('events');
var eventHandler = new events.EventEmitter();
var RobotPlayer = require('./robotPlayer');

module.exports = function (gameId, pEventHandler) {
	var eventHandler = pEventHandler;
    var sockets = [];
	var connectedGame = {};

	connectedGame.gameId = gameId;
	
	connectedGame.sendMessages = function(gameVM, receiveId, showResults) {
		var playersVM = [];
		for (var playerIndex = 0; playerIndex < gameVM.players.length; playerIndex++) {
			if (gameVM.players[playerIndex].type === '')
				playersVM.push({
					turn: false, 
					person: false, 
					type: false,
					position: gameVM.players[playerIndex].position,
					teamIndex: gameVM.players[playerIndex].teamIndex,
					handCards: 0,
					footCards: 0
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
					myUpdate: false,
					teamIndex: playerVM.teamIndex,
					handCards: 0,
					footCards: 0
				});
			else {
				otherPlayers.push({
					person: playerVM.person,
					position: playerVM.position,
					turn: false,
					inFoot: playerVM.inFoot,
					footCards: playerVM.footCards.length,
					handCards: playerVM.handCards.length,
					myUpdate: false,
					teamIndex: playerVM.teamIndex
				});
			}
		}
		
		playersVM[gameVM.turn].turn = true;
		otherPlayers[gameVM.turn].turn = true;
		
		for (var pileIndex = 0; pileIndex < 4; pileIndex++) {
			gameVM.drawPiles[pileIndex].cards = gameVM.drawPiles[pileIndex].cards.length;
		}
		
		if (sockets.length > gameVM.numberOfPlayers) {
			console.log('too many sockets', sockets.length);
			console.log(sockets);
		}

		// send update game with players and teams properly ordered
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
			
			// assemble players
			var players = [];
			for (var playerIndex = 0; playerIndex < playersVM.length; playerIndex++) {
				var socketPlayerIndex = playerIndex + socket.position;
				if (socketPlayerIndex >= playersVM.length)
					socketPlayerIndex -= playersVM.length;
				
				if (playerIndex === 0) {
					playersVM[socketPlayerIndex].myUpdate = 
						socket.type === 'robot' 
							? (receiveId == socket.robotId) 
							: (receiveId === socket.socket.id.toString());
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
				socket.socket.emit('handResults', results);
			}
			
			// send the new data to each player
			if (socket.type === 'person')
				socket.socket.emit('gameUpdate', { game: gameVM, players: players, teams: teams });
			else
				socket.robot.emit('gameUpdate', { game: gameVM, players: players, teams: teams });
		}
	};
	
	// send chat message
	connectedGame.sendChatMessage = function(data) {
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
	
			// send the new data to each player
			if (socket.type === 'person')
				socket.socket.emit('chatUpdate', data);
			else
				socket.robot.emit('chatUpdate', data);
		}
	};
	
	// add a player to a game
	connectedGame.addPlayer = function(socket, data) {
		// in case the socket already exists for this position - remove it
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			if (sockets[socketIndex].position === data.position) {
				sockets.splice(socketIndex, 1);
				break;
			}
		}
		
		// push new player
		sockets.push({ position: data.position, type: 'person', socket: socket} );
	};
	
	// add a robot to a game
	connectedGame.addRobot = function(data) {
		// in case the socket already exists for this position - remove it
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			if (sockets[socketIndex].position === data.position) {
				sockets.splice(socketIndex, 1);
				break;
			}
		}
		
		// push new robot
		var robot = new RobotPlayer(data.gameId, data.position, eventHandler);
		sockets.push({ position: data.position, type: 'robot', robot: robot} );
	};
	
	// add a robot to a game
	connectedGame.addRobots = function(gameVM, data) {
		// add any robots to the game
		for (var playerIndex = 0; playerIndex < gameVM.numberOfPlayers; playerIndex++) {
			var playerVM = gameVM.players[playerIndex];
			if (playerVM.type === 'robot') {
				// in case the socket already exists for this position - remove it
				for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
					if (sockets[socketIndex].position === playerVM.position) {
						console.log('robot exists at position ' + playerVM.position);
						sockets.splice(socketIndex, 1);
						break;
					}
				}
				
				// push new robot
				var robot = new RobotPlayer(data.gameId, playerIndex, eventHandler);
				sockets.push({ position: playerVM.position, type: 'robot', robot: robot} );
			}
		}
	};

	// remove player from connected game
	connectedGame.removePlayer = function(receiveId, gameVM) {
		// remove the socket
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			if (sockets[socketIndex].type === 'person' && sockets[socketIndex].socket.id.toString() === receiveId) {
				sockets.splice(socketIndex, 1);
				break;
			}
		}
		
		// if not players left then tell caller that to remove the connected game
		if (sockets.length === 0)
			return true;
			
		// send the message to the remaining players
		this.sendMessages(gameVM, receiveId);
	};
	
	// send end hand question
	connectedGame.sendEndHandQuestion = function(connectedPlayer) {
		// send to each player
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
			
			if (socket.type === 'person')
				socket.socket.emit('endHandQuestion', { position: connectedPlayer.position, personName: connectedPlayer.personName });
			else
				socket.robot.emit('endHandQuestion', { position: connectedPlayer.position, personName: connectedPlayer.personName });
		}
	};
	
	// send end hand response
	connectedGame.sendEndHandResponse = function(data) {
		// send to each player
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
			
			if (socket.type === 'person')
				socket.socket.emit('endHandResponse', data);
			else
				socket.robot.emit('endHandResponse', data);
		}
	};
	
	// send resign question
	connectedGame.sendResignRequest = function(connectedPlayer) {
		// send to each player
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
			
			if (socket.type === 'person')
				socket.socket.emit('resignRequest', { position: connectedPlayer.position, personName: connectedPlayer.personName });
			else
				socket.robot.emit('resignRequest', { position: connectedPlayer.position, personName: connectedPlayer.personName });
		}
	};
	
	// send resign response
	connectedGame.sendResignNoResponse = function() {
		// send to each player
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
			
			if (socket.type === 'person')
				socket.socket.emit('resignResponse', { result: 'no'});
			else
				socket.robot.emit('resignResponse', { result: 'no'});
		}
	};
	
	// send resign response
	connectedGame.sendResignYesResponse = function(resignedTeam, winningTeam) {
		// send to each player
		for (var socketIndex = 0; socketIndex < sockets.length; socketIndex++) {
			var socket = sockets[socketIndex];
			var position = sockets[socketIndex].position;

			var teamGame = _this.getTeam(game, position);
			var status = 'loss';
			if (gameTeam == resignedTeam)
				status = 'resigned';
			else if (gameTeam == winningTeam)
				status = 'win';
			
			if (socket.type === 'person')
				socket.socket.emit('resignResponse', { result: status });
			else
				socket.robot.emit('resignResponse', { result: status });
		}
	};
	
	return connectedGame;
};