import BaseSocketGame from './BaseSocketGame';

export default class UpdateGame extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'endHandResponse', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        this.connectedPlayer = playGame.findConnectedPlayer(socket);
        if (!this.connectedPlayer)
            return;

        // update the game and, optionally, the game VM
        this.mapper.updateGame(this.connectedPlayer.gameId, data.player, data.melds, data.action, data.control)
            .then(this.onUpdateGameResults.bind(this))
            .catch(err => {
                this.logger.log('Update Game');
                this.logger.log(err.stack);
                this.logger.log(data.gameId);
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
            playGame.endTheGame(this.socket, this.mapper, false);
        } else {
            // find the game, error if it doesn't exist
            const connectedGame = playGame.findConnectedGame(this.socket, this.connectedPlayer.gameId);
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
