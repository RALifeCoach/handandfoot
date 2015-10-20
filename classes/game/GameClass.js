import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import * as teamBL from '../TeamBL';
import * as playerBL from '../PlayerBL';
import * as personBL from '../PersonBL';
import * as handUtil from './HandUtil';
import * as playerUtil from './PlayerUtil';
import * as scoreUtil from './ScoreUtil';
import * as updateUtil from './UpdateUtil';
import * as serializeUtil from './SerializeUtil';
import * as PlayerVM from '../../viewmodels/PlayerVM';
import * as MeldsVM from '../../viewmodels/MeldsVM';

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

  // save this game to the DB
  save() {
    let DbGame = mongoose.model('Game');
    let _this = this;
    let game = GAME.get(this).game;
    return new Promise((resolve, reject) => {
      DbGame.findById(game.id, (err, checkGame) => {
        if (err) {
          console.log('Error getting check game');
          console.log(err.stack);
          return reject(err);
        }
        if (checkGame && checkGame.__v !== game.__v) {
          console.log('Game has been updated in DB since this row was retrieved');
          let err = new Error('Concurrency confict');
          return reject(err);
        }
        game.save((err, savedGame) => {
          if (err) {
            console.log('error saving game');
  					console.log(err.stack);
            return reject(err);
          }

          GAME.get(_this).game = savedGame;
          return resolve(_this);
        });
      });
    });
  }

  // the following methods use the hand utilities
  dealNewHand() {
    handUtil.dealNewHand(GAME.get(this));
  }

  startNewHand() {
    handUtil.startNewHand(GAME.get(this));
  }

  // end the hand
	endTheHand() {
    handUtil.endTheHand(GAME.get(this));

		// increment the round and end the game if the final round has been played
		if (game.round > 6) {
			this.endTheGame();
		}
	}

  // the follwing methods use the player utilites
	addPlayer(personId, direction) {
    let _this = this;
    return new Promise((resolve, reject) => {
      playerUtil.addPlayer(GAME.get(this), personId, direction)
      .then(() => {
        return _this.save()
      })
      .then(game => resolve(game))
      .catch(err => {
        console.log(err.stack);
        reject(err)
      });
    });
  }

  // end the game
  endTheGame() {
    GAME.get(this).game.gameComplete = true;
  }

  // the following methods use the score utilities
  // build the stats
  buildStats(direction, youResigned, theyResigned) {
    return scoreUtil.buildStats(GAME.get(this), direction, youResigned, theyResigned)
  }

  // score the game
	score(winningTeam) {
    return scoreUtil.score(GAME.get(this), winningTeam);
	}

  // the following methods use the serialize utilites
  // deserialize into GameVM
  deserialize() {
    return serializeUtil.deserialize(GAME.get(this));
  }

  // the following methods use the update utilities
  updateGame(playerVM:PlayerVM.PlayerVM,
    meldsVM:MeldsVM.MeldsVM,
    action,
    control) {
    let _this = this;
    return new Promise((resolve, reject) => {
      let results = updateUtil.updateGame(GAME.get(this),
        playerVM,
        meldsVM,
        action,
        control);

      _this.save()
      .then(game => {
        resolve(game, results);
      })
    })
  }
}

// make this public and keep the rest private
export function createGameClass(game) {
  return new Game(game);
}
