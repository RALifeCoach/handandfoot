import Base from './Base';

export default class ConnectedGame extends Base {
    constructor(pGameId) {
        super();
        this.gameId = pGameId;
        this.sockets = [];
    }

    sendMessages(game, receiveSocket, results) {
        const gameVM = game.deserialize();
        const gameObject = {
            playersVM: [],
            otherPlayers: [],
            nsResults: gameVM.results.nsResults,
            ewResults: gameVM.results.ewResults,
            teamsVM: [
                gameVM.nsTeam,
                gameVM.ewTeam
            ]
        };

        gameVM.players.forEach(player => {
            if (!player) {
                gameObject.playersVM.push({
                    turn: false,
                    person: false
                });
            } else {
                const newPlayer = player.deserialize();
                newPlayer.turn = false;
                gameObject.playersVM.push(newPlayer);
            }
        });
        if (gameVM.piles[4].cardPile.cardPile.length) {
            const discardPile = gameVM.piles[4].cardPile.cardPile;
            gameVM.topDiscard = discardPile[discardPile.length - 1].deserialize();
        } else {
            gameVM.topDiscard = false;
        }
        gameVM.piles = gameVM.piles.map(pile => {
            return pile.cardPile.cardPile.length;
        });
        gameVM.players = [];
        gameVM.nsTeam = null;
        gameVM.ewTeam = null;
        gameVM.results = false;

        // create player objects used to send basic information (no card details)
        gameObject.playersVM.forEach(playerVM => {
            playerVM.myUpdate = false;
            if (!playerVM.person)
                gameObject.otherPlayers.push({
                    turn: false,
                    person: false,
                    inFoot: false,
                    myUpdate: false
                });
            else {
                gameObject.otherPlayers.push({
                    person: playerVM.person,
                    direction: playerVM.direction,
                    turn: false,
                    inFoot: playerVM.inFoot,
                    cards: playerVM.cards.length,
                    myUpdate: false
                });
            }
        });

        gameObject.playersVM[gameVM.turn].turn = true;
        gameObject.otherPlayers[gameVM.turn].turn = true;

        if (this.sockets.length > 4) {
            this.logger.warn('too many sockets', this.sockets.length);
            this.logger.warn(this.sockets);
        }

        // send update game with players properly ordered
        this.sockets.forEach(socketVM => {
            ConnectedGame.sendMessageSocket(socketVM, receiveSocket, gameVM, gameObject, results);
        });
    }

    static sendMessageSocket(socketVM, receiveSocket, gameVM, gameObject, results) {
        const socket = socketVM.socket;
        const players = [];
        const teams = [];
        const resultsVM = [];

        switch (socketVM.direction) {
            case 'North':
                gameObject.playersVM[0].myUpdate = receiveSocket === socket;
                players.push(gameObject.playersVM[0]);
                players.push(gameObject.otherPlayers[1]);
                players.push(gameObject.otherPlayers[2]);
                players.push(gameObject.otherPlayers[3]);
                teams.push(gameObject.teamsVM[0]);
                teams.push(gameObject.teamsVM[1]);
                resultsVM.push(gameObject.nsResults);
                resultsVM.push(gameObject.ewResults);
                break;
            case 'East':
                gameObject.playersVM[1].myUpdate = receiveSocket === socket;
                players.push(gameObject.playersVM[1]);
                players.push(gameObject.otherPlayers[2]);
                players.push(gameObject.otherPlayers[3]);
                players.push(gameObject.otherPlayers[0]);
                teams.push(gameObject.teamsVM[1]);
                teams.push(gameObject.teamsVM[0]);
                resultsVM.push(gameObject.ewResults);
                resultsVM.push(gameObject.nsResults);
                break;
            case 'South':
                gameObject.playersVM[2].myUpdate = receiveSocket === socket;
                players.push(gameObject.playersVM[2]);
                players.push(gameObject.otherPlayers[3]);
                players.push(gameObject.otherPlayers[0]);
                players.push(gameObject.otherPlayers[1]);
                teams.push(gameObject.teamsVM[0]);
                teams.push(gameObject.teamsVM[1]);
                resultsVM.push(gameObject.nsResults);
                resultsVM.push(gameObject.ewResults);
                break;
            case 'West':
                gameObject.playersVM[3].myUpdate = receiveSocket === socket;
                players.push(gameObject.playersVM[3]);
                players.push(gameObject.otherPlayers[0]);
                players.push(gameObject.otherPlayers[1]);
                players.push(gameObject.otherPlayers[2]);
                teams.push(gameObject.teamsVM[1]);
                teams.push(gameObject.teamsVM[0]);
                resultsVM.push(gameObject.ewResults);
                resultsVM.push(gameObject.nsResults);
                break;
            default:
                throw new Error('unknown direction');
        }

        // if the hand ended, send the results
        if (results) {
            socket.emit('handResults', resultsVM);
        }

        try {
            // send the new data to each player
            socket.emit('gameUpdate', {
                game: gameVM,
                players: players,
                teams: teams,
                results: resultsVM
            });
        } catch (err) {
            this.logger.fatal(err.stack);
            throw err;
        }
    }
}
