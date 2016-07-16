import Base from '../classes/Base';

export default class BaseGetRouter extends Base {
    constructor(router, messageName) {
        super();
        router.get('/' + messageName, this.route.bind(this));
        this.messageName = messageName;
    }

    route() {
        this.logger.info('received ' + this.messageName || 'root');
    }
}