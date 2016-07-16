import PlayerVM from './PlayerVM';
import MeldsVM from './MeldsVM';
import GameUtil from '../classes/game/GameUtil';
import Base from '../classes/Base';

export default class GameVM extends Base {
    static scoreTheGame(game, winningTeam) {
        return game.score(winningTeam);
    }

    static addStats(game, direction, youResigned, theyResigned) {
        const results = game.buildStats(direction, youResigned, theyResigned);
        // update the person document

        const person = game.person(direction);
        person.stats.push(results.stat);

        return new Promise((resolve, reject) => {
            person.save()
                .then(() => resolve(this))
                .catch(err => reject(err));
        });
    }

    // update players - record scores
    static updatePlayers(game, personId) {
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
            game.person('North').addStats(results.stat)
                .then(() => {
                    results = game.buildStats('South', nsResigned, ewResigned);
                    return game.person('South').addStats(results.stat);
                })
                .then(() => {
                    results = game.buildStats('East', ewResigned, nsResigned);
                    return game.person('East').addStats(results.stat);
                })
                .then(() => {
                    results = game.buildStats('West', ewResigned, nsResigned);
                    return game.person('West').addStats(results.stat);
                })
                .then(() => resolve())
                .catch(err => {
                    GameVM.loggerWarn(err.stack);
                    reject(err);
                });
        });
    }

    static getAllIncompleteGames(personId) {
        return new Promise((resolve, reject) => {
            GameUtil.findIncompleteGames()
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

    static addPlayer(gameId, personId, direction) {
        return new Promise((resolve, reject) => {
            GameUtil.loadGame(gameId)
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
    static removePlayer(gameId, personId) {
        return new Promise((resolve) => {
            GameUtil.loadGame(gameId)
                .then(game => {
                    // create the existing player
                    var player = GameVM.getPlayer(game);

                    if (!player) {
                        GameVM.loggerWarn(this, 'player not found in game');
                        GameVM.loggerWarn(this, personId);
                        GameVM.loggerWarn(this, game.nsTeam[0].players);
                        GameVM.loggerWarn(this, game.ewTeam[0].players);
                    }

                    player.connected = false;

                    // save the game
                    return game.save();
                })
                .then(game => {
                    resolve(game.deserialize());
                })
                .catch(err => {
                    GameVM.loggerWarn(this, err.stack);
                });
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
    static updateGame(gameId, playerVM, meldsVM, action, control) {
        return new Promise(((resolve, reject) => {
            // find game from DB
            const playerVMClass = new PlayerVM();
            playerVMClass.loadPlayer(playerVM);
            const meldsVMClass = new MeldsVM(meldsVM);
            GameUtil.loadGame(gameId)
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
                        GameVM.updatePlayers(game, false)
                            .then(() => {
                                resolve(results);
                            });
                    } else {
                        resolve(results);
                    }
                })
                .catch(err => {
                    GameVM.loggerWarn(this, err.stack);
                    reject(err);
                });
        }));
    };

    // end the game
    static endGame(gameId, personId, callback) {
        // find game from DB
        GameUtil.loadGame(gameId)
            .then(game => {
                GameVM.scoreTheGame(game, null);
                this.endTheGame(game);

                // save the game
                game.save(err => {
                    if (err) {
                        GameVM.loggerWarn(this, 'error saving game');
                        GameVM.loggerWarn(this, err.stack);
                        GameVM.loggerWarn(this, game);
                        return callback(err);
                    }

                    GameVM.updatePlayers(game, personId)
                });
            })
            .catch(err => callback(err));
    };
}
