import BaseSocketMessage from './BaseSocketMessage';

export default class SendChat extends BaseSocketMessage {
    constructor (socket, playGame) {
        super(socket, playGame, 'sendChat');
    }

    onSocketMessage(data) {
        super.onSocketMessage();

        const text = this.connectedPlayer.personName + ": " + data.chat;
        this.sendMessageToAll(text);
    }
}