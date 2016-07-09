import BaseSocket from './BaseSocket';

export default class JoinGame extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'resignRequest');
    }

    onSocketMessage() {
        super.onSocketMessage();

        this.playGame.sendResignRequest(this.socket);
    }
}
