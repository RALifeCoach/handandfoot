export function dealNewHand(gameData) {
  var allCards = [];

  // create array of all cards
  for (let deckIndex = 0; deckIndex < 6; deckIndex++) {
    for (let suitIndex = 0; suitIndex < 4; suitIndex++) {
      for (let cardIndex = 0; cardIndex < 13; cardIndex++) {
        allCards.push({
          suit: suitIndex,
          number: cardIndex
        });
      }
    }
    allCards.push({
      suit: 4,
      number: -1
    });
    allCards.push({
      suit: 4,
      number: -1
    });
  }

  // load players cards
  for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
    let player;
    switch (playerIndex) {
      case 0: //north
        player = gameData.players[0];
        break;
      case 1: //east
        player = gameData.players[1];
        break;
      case 2: //south
        player = gameData.players[2];
        break;
      case 3: //west
        player = gameData.players[3];
        break;
    }

    for (let handIndex = 0; handIndex < 2; handIndex++) {
      let hand = [];
      for (let cardIndex = 0; cardIndex < 11; cardIndex++) {
        let cardPosition = Math.floor(Math.random() * allCards.length);
        hand.push(allCards[cardPosition]);
        allCards.splice(cardPosition, 1);
      }

      switch (handIndex) {
        case 0:
          player.player.handCards = hand;
          break;
        default:
          player.player.footCards = hand;
          break;
      }
    }
  }

  gameData.game.piles = [ {direction: 'North', cards: [] },
    {direction: 'East', cards: [] },
    {direction: 'South', cards: [] },
    {direction: 'West', cards: [] },
    {direction: 'Discard', cards: [] }
  ];

  // load pickup and discard piles
  let pileMax = Math.floor(allCards.length / 4);
  for (let pileIndex = 0; pileIndex < 4; pileIndex++) {
    for (let cardIndex = 0; cardIndex < pileMax; cardIndex++) {
      let cardPosition = Math.floor(Math.random() * allCards.length);
      gameData.game.piles[pileIndex].cards.push(allCards[cardPosition]);
      allCards.splice(cardPosition, 1);
    }
  }
}

export function startNewHand(gameData) {
  let game = gameData.game;
  game.gameBegun = true;
  game.turn = Math.floor(Math.random() * 4);
  if (game.turn > 3)
    game.turn = 0;
  game.roundStartingPlayer = game.turn;
  game.turnState = "draw1";
}

export function endTheHand(gameData) {
  let game = gameData.game;
  for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
    var team = teamIndex === 0 ? game.nsTeam[0] : game.ewTeam[0];

    team.melds = [];

    team.players.forEach(player => {
      player.handCards = [];
      player.footCards = [];
    });
  }

  game.piles = [
    {direction: 'North', cards: [] },
    {direction: 'East', cards: [] },
    {direction: 'South', cards: [] },
    {direction: 'West', cards: [] },
    {direction: 'Discard', cards: [] }
  ];

  // increment the round and end the game if the final round has been played
  if (++game.round > 6) {
    return;
  }

  // deal of the new hand
  dealNewHand();

  // set the next starting player
  if (++game.roundStartingPlayer > 3)
    game.roundStartingPlayer = 0;
  game.turn = game.roundStartingPlayer;
  game.turnState = 'draw1';
}
