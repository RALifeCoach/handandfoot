import Bunyan from 'bunyan';

export default class BaseSocket {
    constructor (socket, playGame, messageName) {
        this.playGame = playGame;
        this.messageName = messageName;
        this.socket = socket;
        this.logger = Bunyan.createLogger({
            name: 'SocketMessage ' + messageName
        });
        socket.on(messageName, this.onSocketMessage.bind(this));
    }

    sendMessage (connection, messageName, body) {
        this.logger.log('send ' + messageName);
        connection.socket.emit(messageName, body);
    }

    emitMessage (messageName, body) {
        this.logger.log('emit ' + messageName);
        this.socket.server.sockets.emit(messageName, body);
    }

    onSocketMessage () {
        this.logger.log('received ' + this.messageName);
    }
}