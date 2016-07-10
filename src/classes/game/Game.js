import mongoose from 'mongoose';
import TeamBL from '../TeamBL';
import PlayerBL from '../PlayerBL';
import PersonBL from '../PersonBL';
import HandUtil from './HandUtil';
import PlayerUtil from './PlayerUtil';
import ScoreUtil from './ScoreUtil';
import UpdateUtil from './UpdateUtil';
import SerializeUtil from './SerializeUtil';
import Bunyan from 'bunyan';

const GAME = new WeakMap();

class Game {
    constructor(game) {
        this.logger = Bunyan.createLogger({
            name: 'Game'
        });
        const gameData = {
            game: game,
            nsTeam: new TeamBL(game.nsTeam[0]),
            ewTeam: new TeamBL(game.ewTeam[0]),
            players: [
                new PlayerBL('North', game.nsTeam[0].players[0]),
                new PlayerBL('East', game.ewTeam[0].players[0]),
                new PlayerBL('South', game.nsTeam[0].players[1]),
                new PlayerBL('West', game.ewTeam[0].players[1])
            ],
            people: [false, false, false, false],
            personCtr: 0
        };
        GAME.set(this, gameData);

        gameData.players.forEach((player, index) => {
            if (player.personId) {
                gameData.personCtr++;
                PersonBL.loadPerson(player.personId)
                    .then(person => {
                        gameData.people[index] = person;
                        gameData.personCtr--;
                    });
            }
        });
    }

    finishLoading() {
        let _resolve = null;
        const gameData = GAME.get(this);
        const loadingCheck = function () {
            if (gameData.personCtr > 0) {
                return setTimeout(loadingCheck, 100);
            }

            _resolve();
        };

        return new Promise((resolve) => {
            _resolve = resolve;
            setTimeout(loadingCheck, 0);
        });
    }

    get id() {
        return GAME.get(this).game._id
    }

    get name() {
        return GAME.get(this).game.name
    }

    get gameComplete() {
        return GAME.get(this).game.gameComplete
    }

    player(direction) {
        switch (direction) {
            case 'North':
                return GAME.get(this).players[0];
            case 'South':
                return GAME.get(this).players[2];
            case 'East':
                return GAME.get(this).players[1];
            case 'West':
                return GAME.get(this).players[3];
            default:
                return null;
        }
    }

    person(direction) {
        switch (direction) {
            case 'North':
                return GAME.get(this).people[0];
            case 'South':
                return GAME.get(this).people[2];
            case 'East':
                return GAME.get(this).people[1];
            case 'West':
                return GAME.get(this).people[3];
            default:
                return null;
        }
    }

    pile(direction) {
        var pileNo;
        switch (direction) {
            case 'North':
                pileNo = 0;
                break;
            case 'South':
                pileNo = 2;
                break;
            case 'East':
                pileNo = 1;
                break;
            case 'West':
                pileNo = 3;
                break;
            case 'Discard':
                pileNo = 4;
                break;
            default:
                return null;
        }
        return GAME.get(this).game.piles[pileNo];
    }

    team(direction) {
        switch (direction) {
            case 'North':
            case 'South':
                return GAME.get(this).nsTeam;
            case 'East':
            case 'West':
                return GAME.get(this).ewTeam;
            default:
                return null;
        }
    }

    // save this game to the DB
    save() {
        const DbGame = mongoose.model('Game');
        const game = GAME.get(this).game;
        return new Promise((resolve, reject) => {
            DbGame.findById(game.id, (err, checkGame) => {
                if (err) {
                    this.logger.fatal('Error getting check game');
                    this.logger.fatal(err.stack);
                    return reject(err);
                }
                if (checkGame && checkGame.__v !== game.__v) {
                    this.logger.warn('Game has been updated in DB since this row was retrieved');
                    return reject(new Error('Concurrency confict'));
                }
                game.save((err, savedGame) => {
                    if (err) {
                        this.logger.fatal('error saving game');
                        this.logger.fatal(err.stack);
                        return reject(err);
                    }

                    GAME.get(this).game = savedGame;
                    return resolve(this);
                });
            });
        });
    }

    // the following methods use the hand utilities
    dealNewHand() {
        HandUtil.dealNewHand(GAME.get(this));
    }

    startNewHand() {
        HandUtil.startNewHand(GAME.get(this));
    }

    // end the hand
    endTheHand() {
        HandUtil.endTheHand(GAME.get(this));

        // increment the round and end the game if the final round has been played
        if (game.round > 6) {
            this.endTheGame();
        }
    }

    // the follwing methods use the player utilites
    addPlayer(personId, direction) {
        return new Promise(((resolve, reject) => {
            PlayerUtil.addPlayer(GAME.get(this), personId, direction)
                .then(() => {
                    return this.save()
                })
                .then(game => resolve(game))
                .catch(err => {
                    this.logger.fatal('add player');
                    this.logger.fatal(err.stack);
                    reject(err)
                });
        }).bind(this));
    }

    // end the game
    endTheGame() {
        GAME.get(this).game.gameComplete = true;
    }

    // the following methods use the score utilities
    // build the stats
    buildStats(direction, youResigned, theyResigned) {
        return ScoreUtil.buildStats(GAME.get(this), direction, youResigned, theyResigned)
    }

    // score the game
    score(winningTeam) {
        return ScoreUtil.score(GAME.get(this), winningTeam);
    }

    // the following methods use the serialize utilites
    // deserialize into GameVM
    deserialize() {
        return SerializeUtil.deserialize(GAME.get(this));
    }

    // the following methods use the update utilities
    updateGame(playerVM,
               meldsVM,
               action,
               control) {
        let results;
        return new Promise(((resolve, reject) => {
            results = UpdateUtil.updateGame(GAME.get(_this),
                playerVM,
                meldsVM,
                action,
                control);

            this.save()
                .then(game => {
                    results.game = game;
                    resolve(results);
                })
                .catch(err => {
                    this.logger.fatal('save game');
                    this.logger.fatal(err.stack);
                    reject(err);
                });
        }).bind(this));
    }
}

// make this public and keep the rest private
export function createGameClass(game) {
    return new Game(game);
}
