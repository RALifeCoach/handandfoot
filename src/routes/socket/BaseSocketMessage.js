import BaseSocket from './BaseSocket';

export default class BaseSocketMessage extends BaseSocket {
    constructor (socket, playGame, messageName) {
        super(socket, playGame, messageName);
    }

    sendMessageToAll(data) {
        this.logger.log('send to all ' + messageName);

        this.connectedGame.sockets.forEach(connection => {
            this.sendMessage(connection, 'chatUpdate', data);
        });

    }

    onSocketMessage () {
        super.onSocketMessage();

        this.connectedPlayer = playGame.findConnectedPlayer(this.socket);
        if (!this.connectedPlayer) {
            return false;
        }

        this.connectedGame = playGame.findConnectedGame(this.socket, this.connectedPlayer.gameId);
        return !this.connectedGame;
    }
}