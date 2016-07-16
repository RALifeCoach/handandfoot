export default class UpdateUtil {
    static updateGame(gameData, playerVM, meldsVM, action, control) {
        const game = gameData.game;
        // get the player and team to be updated
        var player;
        var team;
        var position;
        switch (playerVM.direction) {
            case 'North':
                player = gameData.players[0];
                team = gameData.nsTeam;
                position = 0;
                break;
            case 'East':
                player = gameData.players[1];
                team = gameData.ewTeam;
                position = 1;
                break;
            case 'South':
                player = gameData.players[2];
                team = gameData.nsTeam;
                position = 2;
                break;
            case 'West':
                player = gameData.players[3];
                team = gameData.ewTeam;
                position = 3;
                break;
            default:
                throw new Error('unknown direction ' + playerVM.direction);
        }

        // if this is coming from someone other than the current player then
        // update cards and be done
        if (!playerVM.turn) {
            player.updateHands(playerVM);
            return({ updatePlayers: false });
        }

        // if the size of the hand or foot has changed then the other players will be notified
        var updatePlayers = false;
        if (player.handCards.length !== playerVM.handCards.length
            || player.footCards.length !== playerVM.footCards.length)
            updatePlayers = true;

        // update the hand and foot
        player.updateHands(playerVM);

        // update the melds - again notify players if melds being updated
        updatePlayers = meldsVM.unloadTo(updatePlayers, team.melds);

        // handle actions
        if (action) {
            updatePlayers = true;
            var cards = player.handCards.length === 0 ? player.footCards : player.handCards;

            if (action.action === "drawCard") {
                // draw a card
                if (action.pileIndex < 0 || action.pileIndex > 3) {
                    console.log("PileIndex out of range attempting to draw a card");
                    throw new Error("PileIndex out of range attempting to draw a card");
                }

                // set the new turn state
                switch (control.turnState) {
                    case 'draw1':
                        control.turnState = 'draw2'
                        break;
                    case 'draw2':
                        control.turnState = 'play'
                        break;
                    case 'draw3':
                        if (--control.drawCards <= 0)
                            control.turnState = 'play'
                        break;
                }
                // draw the card
                cards.push(game.piles[action.pileIndex].cards.pop());
            } else if (action.action === "discardCard") {
                // discard the selected card
                if (action.cardIndex < 0 || action.cardIndex >= cards.length) {
                    console.log("CardIndex out of range attempting to discard");
                    throw new Error("CardIndex out of range attempting to discard");
                }

                control.turnState = 'end';
                game.piles[4].cards.push(cards[action.cardIndex]);
                cards.splice(action.cardIndex, 1);

                // if the discard puts the player into their foot then send a message
                if (!player.inFoot && cards.length === 0) {

                }
            } else if (action.action === "drawSevenCards") {
                // draw seven cards from the discard pile
                // the first card is already moved to the player
                game.piles[4].cards.pop();

                for (var cardIndex = 0; cardIndex < 6 && game.piles[4].cards.length > 0; cardIndex++) {
                    cards.push(game.piles[4].cards.pop());
                }
            }
        }

        // update draw cards
        if (control.drawCards !== game.drawCards) {
            updatePlayers = true;
            game.drawCards = control.drawCards;
        }

        var results = false;
        // update the turn state
        if (control.turnState !== game.turnState) {
            updatePlayers = true;
            game.turnState = control.turnState;
            // if the hand has ended then perform end of hand routines
            switch (control.turnState) {
                case 'endHand':
                    results = _this.scoreTheGame(game, team);
                    _this.endTheHand(game);
                    break;

                // if the current player's turn has ended then move on to the next player
                // endHand also falls through to here
                case 'end':
                    if (++game.turn > 3)
                        game.turn = 0;
                    game.turnState = 'draw1';
            }
        }

        return({ updatePlayers: updatePlayers, results: results });
    }
}

