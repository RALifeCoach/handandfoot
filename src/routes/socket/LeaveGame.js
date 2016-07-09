import BaseSocketGame from './BaseSocketGame';

export default class LeaveGame extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'leaveGame', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        // this is moved to a common method because it is also performed in 'disconnect'
        playGame.leaveGame(this.socket, this.mapper);
    }
}
