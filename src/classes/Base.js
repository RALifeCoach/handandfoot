import Bunyan from 'bunyan';

export default class Base {
    constructor() {

        this.logger = Bunyan.createLogger({
            name: this.constructor.name
        });

    }

    static loggerInfo(message) {
        const logger = Bunyan.createLogger({
            name: this.constructor.name
        });
        logger.info(message);
    }

    static loggerWarn(callingClass, message) {
        const logger = Bunyan.createLogger({
            name: callingClass.constructor.name
        });
        logger.warn(message);
    }
}