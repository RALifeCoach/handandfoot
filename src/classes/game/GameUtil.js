import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import * as gameClass from './Game';

export default class GameUtil {
    static loadGame(gameId) {
        const DbGame = mongoose.model('Game');
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
                let newGame = gameClass.createGameClass(game);
                newGame.finishLoading()
                    .then(() => resolve(newGame));
            });
        });
    }

    static createGame() {
        const DbGame = mongoose.model('Game');
        var game;
        switch (arguments.length) {
            case 1: // the mongoose game class
                game = arguments[0];
                break;
            case 2: // create a new game passing in name and password
                const name = arguments[0];
                const password = arguments[1];
                game = new DbGame({name: name, password: password});
                const player = { person: [], direction: '', handCards: [], footCards: []};
                const team = { score: 0, players: [player, player]};

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
        var newGameBL = gameClass.createGameClass(game);
        return new Promise((resolve) => {
            newGameBL.finishLoading()
                .then(() => resolve(newGameBL));
        });
    }

    static turnOffConnected(personId) {
        const DbGame = mongoose.model('Game');
        // update DB to turn off connected flag for person
        return new Promise((resolve, reject) => {
            const objPersonId = new ObjectId(personId);
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
                        if (game.nsTeam[0].players[0].person.length > 0
                            && game.nsTeam[0].players[0].person[0].toString() === personId)
                            game.nsTeam[0].players[0].connected = false;
                        else if (game.nsTeam[0].players[1].person.length > 0
                            && game.nsTeam[0].players[1].person[0].toString() === personId)
                            game.nsTeam[0].players[1].connected = false;
                        else if (game.ewTeam[0].players[0].person.length > 0
                            && game.ewTeam[0].players[0].person[0].toString() === personId)
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

    static findIncompleteGames() {
        const DbGame = mongoose.model('Game');
        return new Promise((resolve, reject) => {
            DbGame.find().where({gameComplete: false}).exec(function(err, games){
                if(err) {
                    console.log(err.stack);
                    return reject(err);
                }

                let results = [];
                games.forEach(game => results.push(gameClass.createGameClass(game)));
                resolve(results);
            });
        });
    }
}

