import BaseSocket from './BaseSocket';

export default class Disconnect extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'resignResponse');
    }

    onSocketMessage() {
        super.onSocketMessage();

        this.playGame.leaveGame(this.socket);
    }
}
