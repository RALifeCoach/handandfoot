import BaseSocket from './BaseSocket';

export default class BaseSocketGame extends BaseSocket {
    constructor (socket, playGame, messageName, mapper) {
        super(socket, playGame, messageName);
        this.mapper = mapper;
    }
}