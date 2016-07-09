import * as GamePileVM from '../../viewmodels/GamePileVM';
import * as MeldVM from '../../viewmodels/MeldVM';
import * as PlayerVM from '../../viewmodels/PlayerVM';

// deserialize into GameVM
export function deserialize(gameData) {
    const game = gameData.game;
    const gameVM = {
        _id: game.id,
        name: game.name,
        startDate: game.startDate,
        lastPlayedDate: game.lastPlayedDate,
        round: game.round,
        roundStartingPlayer: game.roundStartingPlayer,
        currentPlayer: game.currentPlayer,
        nsTeam: {
            score: gameData.nsTeam.score,
            melds: loadMelds(gameData.nsTeam.melds),
            counts: countMelds(gameData.nsTeam.melds)
        },
        ewTeam: {
            score: game.ewTeam.score,
            melds: loadMelds(gameData.ewTeam.melds),
            counts: countMelds(gameData.ewTeam.melds)
        },
        players: [],
        piles: [
            new GamePileVM.GamePileVM('North', game.piles[0].cards),
            new GamePileVM.GamePileVM('East', game.piles[1].cards),
            new GamePileVM.GamePileVM('South', game.piles[2].cards),
            new GamePileVM.GamePileVM('West', game.piles[3].cards),
            new GamePileVM.GamePileVM('Discard', game.piles[4].cards)
        ],
        gameBegun: game.gameBegun,
        turn: game.turn,
        turnState: game.turnState,
        drawCards: game.drawCards,
        gameComplete: game.gameComplete,
        results: loadResults(game.roundsPlayed)
    };

    deserializePlayers(gameData, gameVM);

    return gameVM;
}

// move melds from game to gameVM
function loadMelds(inMelds) {
    const outMelds = [];

    inMelds.forEach(meld => outMelds.push(new MeldVM.MeldVM(meld)));

    return outMelds;
}

// count meld types
function countMelds(inMelds) {
    var counts = [
        {type: 'Red Threes', count: 0},
        {type: 'Clean Melds', count: 0, melds: ""},
        {type: 'Dirty Melds', count: 0, melds: ""},
        {type: 'Runs', count: 0, melds: ""},
        {type: 'Wild Card Melds', count: 0}
    ];

    inMelds.forEach(meld => {
        if (meld.isComplete) {
            switch (meld.type) {
                case "Red Three":
                    counts[0].count++;
                    break;
                case "Clean Meld":
                    counts[1].count++;
                    counts[1].melds += counts[1].melds === ""
                        ? cards[meld.number]
                        : ", " + cards[meld.number];
                    break;
                case "Dirty Meld":
                    counts[2].count++;
                    counts[2].melds += counts[2].melds === ""
                        ? cards[meld.number]
                        : ", " + cards[meld.number];
                    break;
                case "Run":
                    counts[3].count++;
                    break;
                case "Wild Card Meld":
                    counts[4].count++;
                    break;
            }
        }
    });

    return counts;
}

// load the rounds played into results
function loadResults(roundsPlayed) {
    var results = {
        nsResults: [],
        ewResults: []
    };
    for (var roundIndex = 0; roundIndex < roundsPlayed.length; roundIndex++) {
        var nsTeam = {
            round: roundsPlayed[roundIndex].round,
            baseScore: roundsPlayed[roundIndex].nsTeam.baseScore,
            cardsScore: roundsPlayed[roundIndex].nsTeam.cardsScore,
            priorScore: roundsPlayed[roundIndex].nsTeam.priorScore,
            handScore: roundsPlayed[roundIndex].nsTeam.baseScore
            + roundsPlayed[roundIndex].nsTeam.cardsScore,
            newScore: roundsPlayed[roundIndex].nsTeam.baseScore
            + roundsPlayed[roundIndex].nsTeam.cardsScore
            + roundsPlayed[roundIndex].nsTeam.priorScore
        };
        results.nsResults.push(nsTeam);
        var ewTeam = {
            round: roundsPlayed[roundIndex].round,
            baseScore: roundsPlayed[roundIndex].ewTeam.baseScore,
            cardsScore: roundsPlayed[roundIndex].ewTeam.cardsScore,
            priorScore: roundsPlayed[roundIndex].ewTeam.priorScore,
            handScore: roundsPlayed[roundIndex].ewTeam.baseScore
            + roundsPlayed[roundIndex].ewTeam.cardsScore,
            newScore: roundsPlayed[roundIndex].ewTeam.baseScore
            + roundsPlayed[roundIndex].ewTeam.cardsScore
            + roundsPlayed[roundIndex].ewTeam.priorScore
        };
        results.ewResults.push(ewTeam);
    }
    return results;
}

// deserialize the players
function deserializePlayers(gameData, gameVM) {
    let playerVM;
    if (!gameData.people[0]) {
        gameVM.players.push(false);
    } else {
        playerVM = new PlayerVM.PlayerVM(gameData.people[0]);
        playerVM.loadPlayer(gameData.players[0]);
        gameVM.players.push(playerVM);
    }

    if (!gameData.people[1]) {
        gameVM.players.push(false);
    } else {
        playerVM = new PlayerVM.PlayerVM(gameData.people[1]);
        playerVM.loadPlayer(gameData.players[1]);
        gameVM.players.push(playerVM);
    }

    if (!gameData.people[2]) {
        gameVM.players.push(false);
    } else {
        playerVM = new PlayerVM.PlayerVM(gameData.people[2]);
        playerVM.loadPlayer(gameData.players[2]);
        gameVM.players.push(playerVM);
    }

    if (!gameData.people[3]) {
        gameVM.players.push(false);
    } else {
        playerVM = new PlayerVM.PlayerVM(gameData.people[3]);
        playerVM.loadPlayer(gameData.players[3]);
        gameVM.players.push(playerVM);
    }

    var players = 0;
    gameVM.players.forEach(playerVM => {
        if (playerVM.hasPerson)
            players++;
    });
    gameVM.playersFull = players === 4;
}
