import ConnectedGame from './ConnectedGame';
import Base from './Base';
import GameVM from '../viewmodels/GameVM';

export default class PlayGame extends Base {
    constructor() {
        super();
        this.connectedPlayers = [];
        this.connectedGames = [];
    }

    leaveGame(socket) {
        // common routine for leaving the game
        // check to see if the player is playing a game
        var connectedPlayer = this.findConnectedPlayer(socket);
        if (!connectedPlayer)
            return;

        // add the player and socket to the game VM
        GameVM.removePlayer(connectedPlayer.gameId, connectedPlayer.personId,
            ((err, gameVM) => {
                if (err) {
                    this.logger.warn(err.stack);
                    return;
                }

                this.onRemovePlayerComplete(gameVM, socket, connectedPlayer);
            }).bind(this));
    };

    onRemovePlayerComplete(gameVM, socket, connectedPlayer) {
        // find the game, error if it doesn't exist
        var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
        if (!connectedGame)
            return;

        // remove player from connected players
        var playerIndex = _this.connectedPlayers.indexOf(connectedPlayer);
        this.connectedPlayers.splice(playerIndex, 1);

        // if it's the last player then remove the game
        if (connectedGame.sockets.length === 1) {
            var gameIndex = _this.connectedGames.indexOf(connectedGame);
            this.connectedGames.splice(gameIndex, 1);
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
    }

    newConnectedPlayer(socket, data) {
        // check to see if the player is already playing a game
        for (var playerIndex = 0; playerIndex < this.connectedPlayers.length; playerIndex++) {
            if (this.connectedPlayers[playerIndex].personId.toString() === data.personId.toString()) {
                this.logger.warn(this.connectedPlayers[playerIndex]);
                this.logger.warn('player already playing');

                this.connectedPlayers.splice(playerIndex, 1);
                break;
            }
        }

        // add the new player to the list of players
        this.connectedPlayers.push({
            personId: data.personId,
            direction: data.direction,
            personName: data.name,
            socketId: socket.id,
            gameId: data.gameId
        });
        return true;
    };

    findCreateConnectedGame(socket, data) {
        // find the game, create if it doesn't exist
        var connectedGame = false;
        for (const game of this.connectedGames) {
            if (game.gameId.toString() === data.gameId.toString()) {
                connectedGame = game;
                break;
            }
        }

        // in no connected game found then create one
        if (!connectedGame) {
            connectedGame = new ConnectedGame(data.gameId);
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
        connectedGame.sockets.push({direction: data.direction, socket: socket});

        return connectedGame;
    };

    findConnectedPlayer(socket) {
        // check to see if the player is playing a game
        var connectedPlayer = false;
        for (const player of this.connectedPlayers) {
            if (player.socketId.toString() === socket.id.toString()) {
                connectedPlayer = player;
                break;
            }
        }
        if (!connectedPlayer) {
            this.logger.warn('player not playing');
            return false;
        }

        return connectedPlayer;
    };

    findConnectedGame(socket, gameId) {
        // find the game, error if it doesn't exist
        var connectedGame = false;
        for (const game of this.connectedGames) {
            if (game.gameId.toString() === gameId.toString()) {
                connectedGame = game;
                break;
            }
        }
        if (!connectedGame) {
            this.logger.warn('game not found');
            socket.emit('error', {error: 'Game not found'});
            return;
        }

        return connectedGame;
    };

    // received end hand question - send it to all players
    sendEndHandQuestion(socket) {
        // check to see if the player is playing a game
        var connectedPlayer = this.findConnectedPlayer(socket);
        if (!connectedPlayer)
            return;

        // find the game, error if it doesn't exist
        var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
        if (!connectedGame)
            return;

        // send to each player
        for (const socketVM of connectedGame.sockets) {
            socketVM.socket.emit('endHandQuestion', {
                direction: connectedPlayer.direction,
                personName: connectedPlayer.personName
            });
        }
    };

    // received end hand question - send it to all players
    sendEndHandResponse(socket, data) {
        // check to see if the player is playing a game
        var connectedPlayer = this.findConnectedPlayer(socket);
        if (!connectedPlayer)
            return;

        // find the game, error if it doesn't exist
        var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
        if (!connectedGame)
            return;

        // send to each player
        for (const socketVM of connectedGame.sockets) {
            socketVM.socket.emit('endHandResponse', data);
        }
    };

    // received a request to resign - send it to all players
    sendResignRequest(socket) {
        // check to see if the player is playing a game
        var connectedPlayer = this.findConnectedPlayer(socket);
        if (!connectedPlayer)
            return;

        // find the game, error if it doesn't exist
        var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
        if (!connectedGame)
            return;

        // send to each player
        for (const socketVM of connectedGame.sockets) {
            socketVM.socket.emit('resignRequest', {
                direction: connectedPlayer.direction,
                personName: connectedPlayer.personName
            });
        }
    };

    endTheGame(socket, wasResigned) {
        // find the player, error if not found
        var connectedPlayer = this.findConnectedPlayer(socket);
        if (!connectedPlayer)
            return;

        var personId = wasResigned ? connectedPlayer.personId : false;
        GameVM.endGame(connectedPlayer.gameId, personId, ((err, game) => {
            if (err) {
                return;
            }

            this.onEndGameComplete(game, socket, wasResigned, connectedPlayer);
        }).bind(this));
    }

    onEndGameComplete(game, socket, wasResigned, connectedPlayer) {
        // find the game, error if it doesn't exist
        var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
        if (!connectedGame)
            return;

        // send the resign response
        for (const socketVM of connectedGame) {
            const sendSocket = socketVM.socket;
            const results = PlayGame.getResults(direction, wasResigned, connectedPlayer, game);

            // send the resign response to each player
            sendSocket.emit('resignResponse', {
                result: results
            });
        }
    };

    static getResults(direction, wasResigned, connectedPlayer, game) {
        switch (direction) {
            case 'North':
            case 'South':
                return PlayGame.getResultsDirection(wasResigned, connectedPlayer, ['East', 'West'],
                    [game.nsTeam[0].score, game.ewTeam[0].score]);
            case 'East':
            case 'West':
                return PlayGame.getResultsDirection(wasResigned, connectedPlayer, ['North', 'South'],
                    [game.ewTeam[0].score, game.nsTeam[0].score]);
            default:
                throw new Error('unknown direction ' + direction);
        }
    }

    static getResultsDirection(wasResigned, connectedPlayer, directions, scores) {
        if (wasResigned
            && (connectedPlayer.direction === directions[0] || connectedPlayer.direction === directions[1])) {
            return 'winner';
        }
        if (scores[0] > scores[1]) {
            return 'winner';
        }

        return 'loser';
    }

    sendResignNoResponse(socket) {
        // find the player, error if not found
        var connectedPlayer = this.findConnectedPlayer(socket);
        if (!connectedPlayer)
            return;

        // find the game, error if it doesn't exist
        var connectedGame = this.findConnectedGame(socket, connectedPlayer.gameId);
        if (!connectedGame)
            return;

        // send the resign response
        for (const socketVM of connectedGame.sockets) {
            socketVM.socket.emit('resignResponse', {result: 'no'});
        }
    };
}
