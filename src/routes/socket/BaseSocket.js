import Base from '../../classes/Base';

export default class BaseSocket extends Base {
    constructor (socket, playGame, messageName) {
        this.playGame = playGame;
        this.messageName = messageName;
        this.socket = socket;
        socket.on(messageName, this.onSocketMessage.bind(this));
    }

    sendMessage (connection, messageName, body) {
        this.logger.info('send ' + messageName);
        connection.socket.emit(messageName, body);
    }

    emitMessage (messageName, body) {
        this.logger.info('emit ' + messageName);
        this.socket.server.sockets.emit(messageName, body);
    }

    onSocketMessage () {
        this.logger.info('received ' + this.messageName);
    }
}