import BaseSocket from './BaseSocket';
import GameVM from '../../viewmodels/GameVM';

export default class JoinGame extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'joinGame');
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        if (!this.playGame.newConnectedPlayer(this.socket, data)) {
            return;
        }

        // add the player to the game and game VM
        GameVM.addPlayer(data.gameId, data.personId, data.direction)
            .then(game => {
                var connectedGame = this.playGame.findCreateConnectedGame(this.socket, data);
                if (!connectedGame) {
                    return;
                }

                this.emitMessage('refreshGames');

                // send the message
                connectedGame.sendMessages(game, this.socket);
            })
            .catch(err => {
                this.logger.fatal('mapper add player');
                this.logger.fatal(err.stack);
                this.logger.fatal(data.gameId);
                throw err;
            });
    }
}
