import BaseSocketGame from './BaseSocketGame';

export default class Disconnect extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'resignResponse', mapper);
    }

    onSocketMessage() {
        super.onSocketMessage();

        this.playGame.leaveGame(this.socket, this.mapper);
    }
}
