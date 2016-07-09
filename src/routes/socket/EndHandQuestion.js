import BaseSocket from './BaseSocket';

export default class EndHandQuestion extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'endHandQuestion');
    }

    onSocketMessage() {
        super.onSocketMessage();

        this.playGame.sendEndHandQuestion(socket);
    }
}
