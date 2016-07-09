import * as PlayerVM from './PlayerVM';
import * as MeldsVM from './MeldsVM';
import * as gameUtil from '../classes/game/GameUtil';
import bunyan from 'bunyan';

export class GameVM {
    constructor(game) {
        this.logger = bunyan.createLogger({name: 'GameVM'});
        this.game = game;
    }

    static scoreTheGame(game, winningTeam) {
        return game.score(winningTeam);
    }

    addStats(game, direction, youResigned, theyResigned) {
        const results = game.buildStats(direction, youResigned, theyResigned);
        // update the person document

        const person = game.person(direction);
        person.stats.push(results.stat);

        return new Promise((resolve, reject) => {
            person.save()
                .then(() => resolve(_this))
                .catch(err => reject(err));
        });
    }

    // update players - record scores
    updatePlayers(game, personId) {
        var nsResigned = false;
        var ewResigned = false;
        if (personId) {
            if (personId.toString() === game.players('North').personId.toString()
                || personId.toString() === game.players('South').personId.toString())
                nsResigned = true;
            else
                ewResigned = true;
        }

        return new Promise((resolve, reject) => {
            let results;
            results = game.buildStats('North', nsResigned, ewResigned);
            this.person('North').addStats(results.stat)
                .then(() => {
                    results = game.buildStats('South', nsResigned, ewResigned);
                    return this.person('South').addStats(results.stat);
                })
                .then(() => {
                    results = game.buildStats('East', ewResigned, nsResigned);
                    return this.person('East').addStats(results.stat);
                })
                .then(() => {
                    results = game.buildStats('West', ewResigned, nsResigned);
                    return this.person('West').addStats(results.stat);
                })
                .then(() => resolve())
                .catch(err => {
                    this.logger.log(err.stack);
                    reject(err);
                });
        });
    }

    getAllIncompleteGames(personId) {
        return new Promise((resolve, reject) => {
            gameUtil.findIncompleteGames()
                .then(games => {
                    var gamesVM = [];
                    var ctr = games.length;
                    games.forEach(game => {
                        game.finishLoading()
                            .then(() => {
                                const gameVM = game.deserialize();

                                gameVM.playerAttached = false;
                                gameVM.players.forEach(player => {
                                    if (player.person
                                        && player.person.id.toString() === personId.toString()) {
                                        gameVM.playerAttached = true;
                                    }
                                });

                                // add game if it is still awaiting players
                                if (!gameVM.playersFull || gameVM.playerAttached)
                                    gamesVM.push(gameVM);

                                // when all games have been mapped to gameVM return the message to the front end
                                if (--ctr === 0) {
                                    resolve(gamesVM);
                                }
                            });
                    });
                })
                .catch(err => reject(err));
        });
    }

    addPlayer(gameId, personId, direction) {
        return new Promise((resolve, reject) => {
            gameUtil.loadGame(gameId)
                .then(game => {
                    return game.addPlayer(personId, direction);
                })
                .then(game => {
                    resolve(game);
                })
                .catch(err => reject(err));
        });
    }

    // no promise required as it does not return a message
    removePlayer(gameId, personId) {
        return new Promise((resolve) => {
            gameUtil.loadGame(gameId)
                .then(game => {
                    // create the existing player
                    var player = GameVM.getPlayer(game);

                    if (!player) {
                        this.logger.log('player not found in game');
                        this.logger.log(personId);
                        this.logger.log(game.nsTeam[0].players);
                        this.logger.log(game.ewTeam[0].players);
                    }

                    player.connected = false;

                    // save the game
                    return game.save();
                })
                .then(game => {
                    resolve(game.deserialize());
                })
                .catch((err => {
                    this.logger.log(err.stack);
                }).bind(this));
        });
    }

    static getPlayer(game) {
        var player = null;
        if (game.player('North') && game.player('North').personId.toString() === personId.toString()) {
            player = game.player('North');
        } else if (game.player('South') && game.player('South').personId.toString() === personId.toString()) {
            player = game.player('South');
        } else if (game.player('East') && game.player('East').personId.toString() === personId.toString()) {
            player = game.player('East');
        } else if (game.player('West') && game.player('West').personId.toString() === personId.toString()) {
            player = game.player('West');
        }
        return player;
    }
    // update cards from message from a game
    updateGame(gameId, playerVM, meldsVM, action, control) {
        var _this = this;

        return new Promise((resolve, reject) => {
            // find game from DB
            const playerVMClass = new PlayerVM.PlayerVM();
            playerVMClass.loadPlayer(playerVM);
            const meldsVMClass = new MeldsVM.MeldsVM(meldsVM);
            gameUtil.loadGame(gameId)
                .then(game => {
                    return game.updateGame(playerVMClass,
                        meldsVMClass,
                        action,
                        control);
                })
                .then(results => {
                    const game = results.game;
                    // if the game is complete, update the stats
                    if (game.gameComplete) {
                        _this.updatePlayers(game, false)
                            .then(() => {
                                resolve(results);
                            });
                    } else {
                        resolve(results);
                    }
                })
                .catch(err => {
                    this.logger.log(err.stack);
                    reject(err);
                });
        })
    };

    // end the game
    endGame(gameId, personId, callback) {
        // find game from DB
        gameUtil.loadGame(gameId)
            .then((game => {
                GameVM.scoreTheGame(game, null);
                this.endTheGame(game);

                // save the game
                game.save(((err) => {
                    if (err) {
                        this.logger.log('error saving game');
                        this.logger.log(err.stack);
                        this.logger.log(game);
                        return callback(err);
                    }

                    this.updatePlayers(game, personId)
                }).bind(this));
            }).bind(this))
            .catch(err => callback(err));
    };
}
