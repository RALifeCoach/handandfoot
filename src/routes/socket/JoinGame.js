import BaseSocketGame from './BaseSocketGame';

export default class JoinGame extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'joinGame', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        if (!this.playGame.newConnectedPlayer(this.socket, data))
            return;

        // add the player to the game and game VM
        this.mapper
            .addPlayer(data.gameId, data.personId, data.direction)
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
