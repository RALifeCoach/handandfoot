import BaseRouter from '../BasePostRouter';
import GameVM from '../../viewmodels/GameVM';
import GameUtil from '../../classes/game/GameUtil';

export default class GetAll extends BaseRouter {
    constructor(router) {
        super(router, 'getAll');
    }
    
    route(req, res, next) {
        super.route();

        GameUtil.turnOffConnected(req.body.personId)
            .then(() => {
                // find games that are not complete
                return GameVM.getAllIncompleteGames(req.body.personId);
            })
            .then(gamesVM => {
                res.json(gamesVM);
            })
            .catch(err => {
                this.logger.fatal(err);
                this.logger.fatal(err.stack);
                next(err)
            });
    }
}