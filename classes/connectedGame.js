'use strict';

var ConnectedGame = function (pGameId) {
    this.gameId = pGameId;
    this.sockets = [];
}
ConnectedGame.prototype.sendMessages = function (gameVM, receiveSocket, showResults) {
    var playersVM = [];
    for (var playerIndex = 0; playerIndex < gameVM.players.length; playerIndex++) {
        if (gameVM.players[playerIndex].personOffset === -1)
            playersVM.push({
                turn: false, 
                person: false, 
                position: gameVM.players[playerIndex].position
            });
        else
            playersVM.push(gameVM.players[playerIndex]);
    }
    gameVM.players = [];
    
    var teamsVM = [];
    for (var teamIndex = 0; teamIndex < gameVM.teams.length; teamIndex++)
        teamsVM.push(gameVM.teams[teamIndex]);
    gameVM.teams = [];
    
    // create player objects used to send basic information (no card details)
    var otherPlayers = [];
    for (var playerIndex = 0; playerIndex < playersVM.length; playerIndex++) {
        var playerVM = playersVM[playerIndex];
        playerVM.myUpdate = false;
        if (!playerVM.person)
            otherPlayers.push({
                turn: false, 
                person: false, 
                inFoot: false, 
                position: playerVM.position,
                myUpdate: false
            });
        else {
            otherPlayers.push({
                person: playerVM.person,
                position: playerVM.position,
                turn: false,
                inFoot: playerVM.inFoot,
                footCards: playerVM.footCards.length,
                handCards: playerVM.handCards.length,
                myUpdate: false
            });
        }
    }
    
    playersVM[gameVM.turn].turn = true;
    otherPlayers[gameVM.turn].turn = true;
    
    if (this.sockets.length > gameVM.numberOfPlayers) {
        console.log('too many sockets', this.sockets.length);
        console.log(this.sockets);
    }
    
    // send update game with players and teams properly ordered
    for (var socketIndex = 0; socketIndex < this.sockets.length; socketIndex++) {
        var socket = this.sockets[socketIndex];
        
        // assemble players
        var players = [];
        for (var playerIndex = 0; playerIndex < playersVM.length; playerIndex++) {
            var socketPlayerIndex = playerIndex + socket.position;
            if (socketPlayerIndex >= playersVM.length)
                socketPlayerIndex -= playersVM.length;
            
            if (playerIndex === 0) {
                playersVM[socketPlayerIndex].myUpdate = receiveSocket == socket.socket;
                players.push(playersVM[socketPlayerIndex]);
            } else {
                players.push(otherPlayers[socketPlayerIndex]);
            }
        }
        
        // assemble teams
        var teams = [];
        var teamPosition = socket.position % teamsVM.length;
        for (var teamIndex = 0; teamIndex < teamsVM.length; teamIndex++) {
            var socketTeamIndex = teamIndex + teamPosition;
            if (socketTeamIndex >= teamsVM.length)
                socketTeamIndex -= teamsVM.length;
            teams.push(teamsVM[socketTeamIndex]);
        }
        
        // if the hand ended, send the results
        if (showResults) {
            var results = [];
            for (var teamIndex = 0; teamIndex < teamsVM.length; teamIndex++) {
                results.push(teams[teamIndex].results.splice(-1)[0]);
            }
            socket.emit('handResults', resultsVM);
        }
        
        // send the new data to each player
        console.log(gameVM);
        console.log(players);
        console.log(teams);
        socket.socket.emit('gameUpdate', { game: gameVM, players: players, teams: teams });
    }
};
