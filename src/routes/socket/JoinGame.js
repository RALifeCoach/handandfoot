import BaseSocketGame from './BaseSocketGame';

export default class JoinGame extends BaseSocketGame {
    constructor (socket, playGame, mapper) {
        super(socket, playGame, 'joinGame', mapper);
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        if (!playGame.newConnectedPlayer(this.socket, data))
            return;

        // add the player to the game and game VM
        this.mapper
            .addPlayer(data.gameId, data.personId, data.direction)
            .then(game => {
                var connectedGame = playGame.findCreateConnectedGame(this.socket, data);
                if (!connectedGame)
                    return;

                this.emitMessage('refreshGames');

                // send the message
                connectedGame.sendMessages(game, this.socket);
            })
            .catch(err => {
                this.logger.log('mapper add player');
                this.logger.log(err.stack);
                this.logger.log(data.gameId);
                throw err;
            });
    }
}
