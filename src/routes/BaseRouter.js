import Bunyan from 'bunyan';

export default class BaseRouter {
    constructor(router, messageName) {
        this.logger = Bunyan.createLogger({
            name: 'Router ' + messageName
        });

        router.post('/' + messageName, this.route.bind(this));
        this.messageName = messageName;
    }

    route() {
        this.logger.info('received ' + this.messageName || 'root');
    }
}