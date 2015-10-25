import * as express from 'express';
import * as GameVM from '../viewmodels/GameVM';

export class Router {
	constructor(io, playGame) {
		let mapper = new GameVM.GameVM();
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
				connectedGame.sockets.forEach(connection => {
					// send the new data to each player
					var text = connectedPlayer.personName + ": " + data.chat;
					connection.socket.emit('chatUpdate', { chatText: text });
				});
			});

			// message handler for messages from the game
			socket.on('gameMessage', data => {
				console.log('recieved game message');

				var connectedPlayer = playGame.findConnectedPlayer(socket);
				if (!connectedPlayer)
					return;

				var connectedGame = playGame.findConnectedGame(socket, connectedPlayer.gameId);
				if (!connectedGame)
					return;

				// send update game with players properly ordered
				connectedGame.sockets.forEach(connection => {
					// send the new data to each player
					var text = "Game: " + data.message;
					connection.socket.emit('chatUpdate', { chatText: text });
				});
			});

			// message handler for join game message
			socket.on('joinGame', (data) => {
				console.log('recieved join');

				if (!playGame.newConnectedPlayer(socket, data))
					return;

				// add the player to the game and game VM
				mapper.addPlayer(data.gameId, data.personId, data.direction)
				.then(game => {
					var connectedGame = playGame.findCreateConnectedGame(socket, data);
					if (!connectedGame)
						return;

					io.sockets.emit('refreshGames');

					// send the message
					connectedGame.sendMessages(game, socket);
				})
				.catch(err => {
					console.log(err.stack);
					console.log(data.gameId);
					return;
				})
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
			socket.on('updateGame', (data, callback) => {
				console.log('recieved update Cards');

				var connectedPlayer = playGame.findConnectedPlayer(socket);
				if (!connectedPlayer)
					return;

				// update the game and, optionally, the game VM
				mapper.updateGame(connectedPlayer.gameId,
					data.player,
					data.melds,
					data.action,
					data.control)
				.then(results => {
					if (!results.updatePlayers) {
						if (callback) {
							return callback();
						}
						return;
					}

					let gameVM = results.game.deserialize();

					// the game is over
					if (gameVM.gameComplete) {
						playGame.endTheGame(socket, mapper, false);
					} else {
						// find the game, error if it doesn't exist
						var connectedGame = playGame.findConnectedGame(socket, connectedPlayer.gameId);
						if (!connectedGame) {
							if (callback) {
								return callback();
							}
							return;
						}

						// send the updates to the other players
						connectedGame.sendMessages(gameVM, socket, results.results);
					}
				})
				.catch(err => {
					console.log(err.stack);
					console.log(data.gameId);
					return;
				});
			});

			// message handler for disconnect
			socket.on('disconnect', function () {
				console.log('received disconnect');

				playGame.leaveGame(socket, mapper);
			});
		});
	}
}
