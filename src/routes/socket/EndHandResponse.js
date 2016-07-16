import BaseSocket from './BaseSocket';

export default class EndHandResponse extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'endHandResponse');
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        this.playGame.sendEndHandResponse(this.socket, data);
    }
}
