export default class ConnectedGame {
    constructor(pGameId) {
        this.gameId = pGameId;
        this.sockets = [];
    }

    sendMessages(gameVM, receiveSocket, results) {
        var playersVM = [];

        console.log('game', gameVM);
        gameVM.players.forEach(player => {
            if (!player)
                playersVM.push({turn: false, person: false});
            else
                playersVM.push(player.deserialize());
        });
        gameVM.players = [];

        var teamsVM = [gameVM.nsTeam, gameVM.ewTeam];
        gameVM.nsTeam = false;
        gameVM.ewTeam = false;

        var nsResults = gameVM.results.nsResults;
        var ewResults = gameVM.results.ewResults;
        gameVM.results = false;
        var resultsVM = [];

        // create player objects used to send basic information (no card details)
        var otherPlayers = [];
        playersVM.forEach(playerVM => {
            playerVM.myUpdate = false;
            if (!playerVM.person)
                otherPlayers.push({turn: false, person: false, inFoot: false, myUpdate: false});
            else {
                otherPlayers.push({
                    person: playerVM.person,
                    direction: playerVM.direction,
                    turn: false,
                    inFoot: playerVM.inFoot,
                    cards: playerVM.inFoot ? playerVM.footCards.length : playerVM.handCards.length,
                    myUpdate: false
                });
            }
        });

        playersVM[gameVM.turn].turn = true;
        otherPlayers[gameVM.turn].turn = true;

        if (this.sockets.length > 4) {
            console.log('too many sockets', this.sockets.length);
            console.log(this.sockets);
        }

        // send update game with players properly ordered
        this.sockets.forEach(socketVM => {
            let socket = socketVM.socket;
            let players = [];
            let teams = [];

            switch (socketVM.direction) {
                case 'North':
                    playersVM[0].myUpdate = receiveSocket == socket;
                    players.push(playersVM[0]);
                    players.push(otherPlayers[1]);
                    players.push(otherPlayers[2]);
                    players.push(otherPlayers[3]);
                    teams.push(teamsVM[0]);
                    teams.push(teamsVM[1]);
                    resultsVM.push(nsResults);
                    resultsVM.push(ewResults);
                    break;
                case 'East':
                    playersVM[1].myUpdate = receiveSocket == socket;
                    players.push(playersVM[1]);
                    players.push(otherPlayers[2]);
                    players.push(otherPlayers[3]);
                    players.push(otherPlayers[0]);
                    teams.push(teamsVM[1]);
                    teams.push(teamsVM[0]);
                    resultsVM.push(ewResults);
                    resultsVM.push(nsResults);
                    break;
                case 'South':
                    playersVM[2].myUpdate = receiveSocket == socket;
                    players.push(playersVM[2]);
                    players.push(otherPlayers[3]);
                    players.push(otherPlayers[0]);
                    players.push(otherPlayers[1]);
                    teams.push(teamsVM[0]);
                    teams.push(teamsVM[1]);
                    resultsVM.push(nsResults);
                    resultsVM.push(ewResults);
                    break;
                case 'West':
                    playersVM[3].myUpdate = receiveSocket == socket;
                    players.push(playersVM[3]);
                    players.push(otherPlayers[0]);
                    players.push(otherPlayers[1]);
                    players.push(otherPlayers[2]);
                    teams.push(teamsVM[1]);
                    teams.push(teamsVM[0]);
                    resultsVM.push(ewResults);
                    resultsVM.push(nsResults);
                    break;
            }

            // if the hand ended, send the results
            if (results)
                socket.emit('handResults', resultsVM);

            // send the new data to each player
            socket.emit('gameUpdate', {game: gameVM, players: players, teams: teams, results: resultsVM});
        });
    }
}
