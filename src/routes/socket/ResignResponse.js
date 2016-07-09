import BaseSocketGame from './BaseSocketGame';

export default class ResignResponse extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'resignResponse', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        // end the game
        if (data.result === 'yes') {
            return this.playGame.endTheGame(this.socket, this.mapper, true);
        }

        this.playGame.sendResignNoResponse(socket);
    }
}
