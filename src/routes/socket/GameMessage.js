import BaseSocketMessage from './BaseSocketMessage';

export default class GameMessage extends BaseSocketMessage {
    constructor (socket, playGame) {
        super(socket, playGame, 'gameMessage');
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        // send update game with players properly ordered
        this.connectedGame.sockets.forEach(connection => {
            // send the new data to each player
            const text = "Game: " + data.message;
            this.sendMessage(connection, 'chatUpdate', {
                chatText: text
            });
        });
    }
}