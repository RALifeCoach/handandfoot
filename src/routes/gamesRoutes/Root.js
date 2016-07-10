import BaseRouter from '../BaseRouter';
import SerializeUtil from '../../classes/game/SerializeUtil';
import GameUtil from '../../classes/game/GameUtil';

export default class Root extends BaseRouter {
    constructor(router, io) {
        super(router, '');
        this.io = io;
    }
    
    route(req, res, next) {
        super.route();

        GameUtil.createGame(req.body.game.name, req.body.game.password)
            .then(game => {
                return game.save();
            })
            .then(game => {
                res.json(SerializeUtil.deserialize(game));

                // broadcast to all players
                this.io.sockets.emit('refreshGames');
            })
            .catch(err => {
                this.logger.fatal(err.stack);
                next(err);
            });
    }
}