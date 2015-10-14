import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import * as teamBL from '../classes/TeamBL';
import * as playerBL from '../classes/PlayerBL';
import * as personBL from '../classes/PersonBL';

const GAME = new WeakMap();

class Game {
  constructor(game) {
    let gameData = {
      game: game,
      nsTeam: new teamBL.Team(game.nsTeam[0]),
      ewTeam: new teamBL.Team(game.ewTeam[0]),
      players: [
        new playerBL.Player('North', game.nsTeam[0].players[0]),
        new playerBL.Player('East', game.ewTeam[0].players[0]),
        new playerBL.Player('South', game.nsTeam[0].players[1]),
        new playerBL.Player('West', game.ewTeam[0].players[1])
      ],
      people: [false, false, false, false],
      personCtr: 0
    }
    GAME.set(this, gameData);

    gameData.players.forEach((player, index) => {
      if (player.personId) {
        gameData.personCtr++;
        personBL.loadPerson(player.personId)
        .then(person => {
          gameData.people[index] = person;
          gameData.personCtr--;
        });
      }
    });
  }

  finishLoading() {
    let _resolve = false;
    let gameData = GAME.get(this);
    let loadingCheck = function() {
      if (gameData.personCtr > 0) {
        return setTimeout(loadingCheck, 100);
      }

      _resolve();
    };

    return new Promise((resolve, reject) => {
      _resolve = resolve;
      setTimeout(loadingCheck, 0);
    });
  }

  get id() { return GAME.get(this).game._id }
  get name() { return GAME.get(this).game.name }
  get startDate() { return GAME.get(this).game.startDate }
  get lastPlayedDate() { return GAME.get(this).game.lastPlayedDate }
  get round() { return GAME.get(this).game.round }
  get roundStartingPlayer() { return GAME.get(this).game.roundStartingPlayer }
  get currentPlayer() { return GAME.get(this).game.currentPlayer }
  get gameBegun() { return GAME.get(this).game.gameBegun }
  get turn() { return GAME.get(this).game.turn }
  get turnState() { return GAME.get(this).game.turnState }
  get drawCards() { return GAME.get(this).game.drawCards }
  get gameComplete() { return GAME.get(this).game.gameComplete }
  get roundsPlayed() { return GAME.get(this).game.roundsPlayed }

  player(direction) {
    switch (direction) {
      case 'North': return GAME.get(this).players[0];
      case 'South': return GAME.get(this).players[2];
      case 'East': return GAME.get(this).players[1];
      case 'West': return GAME.get(this).players[3];
    }
    return null;
  }

  person(direction) {
    switch (direction) {
      case 'North': return GAME.get(this).people[0];
      case 'South': return GAME.get(this).people[2];
      case 'East': return GAME.get(this).people[1];
      case 'West': return GAME.get(this).people[3];
    }
    return null;
  }

  pile(direction) {
    switch (direction) {
      case 'North': return GAME.get(this).game.piles[0];
      case 'South': return GAME.get(this).game.piles[2];
      case 'East': return GAME.get(this).game.piles[1];
      case 'West': return GAME.get(this).game.piles[3];
      case 'Discard': return GAME.get(this).game.piles[4];
    }
    return null;
  }

  team(direction) {
    switch (direction) {
      case 'North':
      case 'South':
        return GAME.get(this).nsTeam;
      case 'East':
      case 'West':
        return GAME.get(this).ewTeam;
    }
    return null;
  }

  dealNewHand() {
    var allCards = [];

		// create array of all cards
		for (let deckIndex = 0; deckIndex < 6; deckIndex++) {
			for (let suitIndex = 0; suitIndex < 4; suitIndex++) {
				for (let cardIndex = 0; cardIndex < 13; cardIndex++) {
					allCards.push({
            suit: suitIndex,
            car: cardIndex
          });
				}
			}
			allCards.push({
        suit: 4,
        car: -1
      });
      allCards.push({
        suit: 4,
        car: -1
      });
		}

		// load players cards
		for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
			let player;
			switch (playerIndex) {
				case 0: //north
					player = GAME.get(this).game.nsTeam[0].players[0];
					break;
				case 1: //east
					player = GAME.get(this).game.ewTeam[0].players[0];
					break;
				case 2: //south
					player = GAME.get(this).game.nsTeam[0].players[1];
					break;
				case 3: //west
					player = GAME.get(this).game.ewTeam[0].players[1];
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
						player.handCards = hand;
						break;
					default:
						player.footCards = hand;
						break;
				}
			}
		}

    GAME.get(this).game.piles = [ {direction: 'North', cards: [] },
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
				GAME.get(this).game.piles[pileIndex].cards.push(allCards[cardPosition]);
				allCards.splice(cardPosition, 1);
			}
		}
  }

  startNewHand() {
    let game = GAME.get(this).game;
    game.gameBegun = true;
    game.turn = Math.floor(Math.random() * 4);
    if (game.turn > 3)
      game.turn = 0;
    game.roundStartingPlayer = GAME.get(this).game.turn;
    game.turnState = "draw1";
  }

  save() {
    let _this = this;
    return new Promise((resolve, reject) => {
      GAME.get(_this).game.save((err, savedGame) => {
        if (err) {
          console.log('error saving game');
					console.log(err);
					console.log(game);
					console.log(game.nsTeam);
					console.log(game.ewTeam);
          return reject(err);
        }

        GAME.get(_this).game = savedGame;
        return resolve(_this);
      })
    });
  }

	addPlayer(personId, direction) {
    let _this = this;
    return new Promise((resolve, reject) => {
      let gameData = GAME.get(this);
      let player;
      switch (direction) {
        case 'North':
          player = gameData.players[0];
          break;
        case 'South':
          player = gameData.players[2];
          break;
        case 'East':
          player = gameData.players[1];
          break;
        case 'West':
          player = gameData.players[3];
          break;
      }

			player.addPerson(personId);

			// save the game
			_this.save()
      .then(() => {
        return personBL.loadPerson(personId);
      })
      .then(person => {
        switch (direction) {
          case 'North':
            gameData.people[0] = person;
            break;
          case 'South':
            gameData.people[2] = person;
            break;
          case 'East':
            gameData.people[1] = person;
            break;
          case 'West':
            gameData.people[3] = person;
            break;
        }
        resolve(this);
      })
      .catch(err => reject(err));
    });
  }

  // end the hand
	endTheHand() {
    let game = GAME.get(this).game;
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
			this.endTheGame();
			return;
		}

		// deal of the new hand
		this.dealNewHand();

		// set the next starting player
		if (++game.roundStartingPlayer > 3)
			game.roundStartingPlayer = 0;
		game.turn = GAME.get(this).game.roundStartingPlayer;
		game.turnState = 'draw1';
	}

  // end the game
  endTheGame() {
    GAME.get(this).game.gameComplete = true;
  }

  // build the stats
  buildStats(direction, youResigned, theyResigned) {
    let gameData = GAME.get(this);
    // build the fields needed to get the stats
		var yourScore, yourPartner, theirScore, opponent1, opponent2, personId, status;
		switch (direction) {
			case 'North':
				personId = gameData.people[0].id;
				yourScore = gameData.nsTeam.score;
				yourPartner = gameData.people[2];
				theirScore = gameData.ewTeam.score;
				opponent1 = gameData.people[1];
				opponent2 = gameData.people[3];
				break;
			case 'South':
				personId = gameData.people[2].id;
				yourScore = gameData.nsTeam.score;
				yourPartner = gameData.people[0];
				theirScore = gameData.ewTeam.score;
        opponent1 = gameData.people[1];
				opponent2 = gameData.people[3];
				break;
			case 'East':
				personId = gameData.people[1].id;
				yourScore = gameData.ewTeam.score;
				yourPartner = gameData.people[3];
				theirScore = gameData.nsTeam.score;
        opponent1 = gameData.people[0];
				opponent2 = gameData.people[2];
				break;
			case 'West':
				personId = gameData.people[3].id;
				yourScore = gameData.ewTeam.score;
				yourPartner = gameData.people[1];
				theirScore = gameData.nsTeam.score;
        opponent1 = gameData.people[0];
				opponent2 = gameData.people[2];
				break;
		}

		if (youResigned)
			status = "loss";
		else if (theyResigned)
			status = "win";
		else if (yourScore > theirScore)
			status = "win";
		else if (yourScore < theirScore)
			status = "loss";
		else
			status = "tie";

		// build the stats for the game
		let results = {
      stat: {
  			gameName: gameData.game.name,
  			gameId: gameData.game._id,
  			status: status,
  			roundsPlayed: gameData.game.round,
  			yourTeam: {
  				partner: {
  					personId: yourPartner.id,
  					name: yourPartner.name
  				},
  				score: youResigned ? -99999 : yourScore,
  			},
  			theirTeam: {
  				player1: {
  					personId: opponent1.id,
  					name: opponent1.name
  				},
  				player2: {
  					personId: opponent2.id,
  					name: opponent2.name
  				},
  				score: theyResigned ? -99999 : theirScore
  			}
  		},
      personId: personId
    };
    return results;
  }
}

export function loadGame(gameId) {
  let DbGame = mongoose.model('Game');
  return new Promise((resolve, reject) => {
    var query1 = DbGame.findById(gameId);
		query1.exec(function (err, game){
			if (err) {
				console.log(err.stack);
				console.log(gameId);
				return reject(err);
			}
			if (!game) {
				console.log("can't find game");
				console.log(gameId);
				return reject(new Error("can't find game"));
			}
      let newGame = new Game(game);
      newGame.finishLoading()
      .then(() => resolve(newGame));
    });
  });
}

export function createGame() {
  let DbGame = mongoose.model('Game');
  let game = {};
  switch (arguments.length) {
    case 1: // the mongoose game class
      game = arguments[0];
      break;
    case 2: // create a new game passing in name and password
      let name = arguments[0];
      let password = arguments[1];
      let game = new DbGame({name: name, password: password});
      let player = { person: [], direction: '', handCards: [], footCards: []};
      let team = { score: 0, players: [player, player]};

      game.nsTeam.push(team);
      game.ewTeam.push(team);
      game.piles = [
        { direction: 'North', cards: [] },
        { direction: 'East', cards: [] },
        { direction: 'South', cards: [] },
        { direction: 'West', cards: [] },
        { direction: 'Discard', cards: [] }
      ];
      break;
    default:
      throw new Error('constructor invalid number of arguments');
  }
  var newGameBL = new Game(game);
  return new Promise((resolve, reject) => {
    newGameBL.finishLoading()
    .then(() => resolve(newGameBL));
  });
}

export function turnOffConnected(personId) {
  let DbGame = mongoose.model('Game');
  // update DB to turn off connected flag for person
  return new Promise((resolve, reject) => {
    let objPersonId = new ObjectId(personId);
    DbGame.find({ $or: [{'nsTeam.0.players.person.0': objPersonId},
      {'ewTeam.0.players.person.0': objPersonId}]},
    (err, games) => {
      if (err) {
        console.log(err.stack);
        return reject(err);
      }

      let ctr = games.length;
      if (ctr === 0) {
        return resolve();
      }

      games.forEach(game => {
        if (game.nsTeam[0].players[0].person[0].toString() == personId)
          game.nsTeam[0].players[0].connected = false;
        else if (game.nsTeam[0].players[1].person[0].toString() == personId)
          game.nsTeam[0].players[1].connected = false;
        else if (game.ewTeam[0].players[0].person[0].toString() == personId)
          game.ewTeam[0].players[0].connected = false;
        else
          game.ewTeam[0].players[1].connected = false;
        game.save(err => {
          if (err) {
            console.log(err.stack);
            return reject(err);
          }

          if (--ctr === 0)
            resolve();
        });
      });
    });
  });
}

export function findIncompleteGames() {
  let DbGame = mongoose.model('Game');
  return new Promise((resolve, reject) => {
    DbGame.find().where({gameComplete: false}).exec(function(err, games){
      if(err) {
        console.log(err.stack);
        return reject(err);
      }

      let results = [];
      games.forEach(game => results.push(new Game(game)));
      resolve(results);
    });
  });
}
