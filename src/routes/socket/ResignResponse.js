import BaseSocket from './BaseSocket';

export default class ResignResponse extends BaseSocket {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'resignResponse');
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        // end the game
        if (data.result === 'yes') {
            return this.playGame.endTheGame(this.socket, true);
        }

        this.playGame.sendResignNoResponse(this.socket);
    }
}
