import BaseSocketGame from './BaseSocketGame';

export default class EndHandResponse extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'endHandResponse', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        this.playGame.sendEndHandResponse(this.socket, data);
    }
}
