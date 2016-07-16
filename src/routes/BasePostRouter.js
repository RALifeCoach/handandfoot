import Base from '../classes/Base';

export default class BasePostRouter extends Base {
    constructor(router, messageName) {
        super();
        router.post('/' + messageName, this.route.bind(this));
        this.messageName = messageName;
    }

    route() {
        this.logger.info('received ' + this.messageName || 'root');
    }
}