import BaseSocketGame from './BaseSocketGame';

export default class UpdateGame extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'updateGame', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        this.connectedPlayer = this.playGame.findConnectedPlayer(this.socket);
        if (!this.connectedPlayer)
            return;

        // update the game and, optionally, the game VM
        this.mapper.updateGame(this.connectedPlayer.gameId, data.player, data.melds, data.action, data.control)
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
            if (callback) {
                return callback();
            }
            return;
        }

        const gameVM = results.game.deserialize();

        // the game is over
        if (gameVM.gameComplete) {
            this.playGame.endTheGame(this.socket, this.mapper, false);
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
            connectedGame.sendMessages(gameVM, this.socket, results.results);
        }
    }
}
