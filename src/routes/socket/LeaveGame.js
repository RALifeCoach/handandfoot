import BaseSocket from './BaseSocket';

export default class LeaveGame extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'leaveGame');
    }

    onSocketMessage() {
        super.onSocketMessage();

        // this is moved to a common method because it is also performed in 'disconnect'
        this.playGame.leaveGame(this.socket);
    }
}
