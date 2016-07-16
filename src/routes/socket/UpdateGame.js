import BaseSocket from './BaseSocket';
import GameVM from '../../viewmodels/GameVM';

export default class UpdateGame extends BaseSocket {
    constructor (socket, playGame) {
        super(socket, playGame, 'updateGame');
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        this.connectedPlayer = this.playGame.findConnectedPlayer(this.socket);
        if (!this.connectedPlayer)
            return;

        // update the game and, optionally, the game VM
        GameVM.updateGame(this.connectedPlayer.gameId, data.player, data.melds, data.action, data.control)
            .then(this.onUpdateGameResults.bind(this))
            .catch(err => {
                this.logger.fatal('Update Game');
                this.logger.fatal(err.stack);
                this.logger.fatal(data.gameId);
                throw err;
            });
    }

    onUpdateGameResults(results) {
        if (!results.updatePlayers) {
            return;
        }

        // the game is over
        if (results.game.gameComplete) {
            this.playGame.endTheGame(this.socket, false);
        } else {
            // find the game, error if it doesn't exist
            const connectedGame = this.playGame.findConnectedGame(this.socket, this.connectedPlayer.gameId);
            if (!connectedGame) {
                if (callback) {
                    return callback();
                }
                return;
            }

            // send the updates to the other players
            connectedGame.sendMessages(results.game, this.socket, results.results);
        }
    }
}
