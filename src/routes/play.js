import GameVM from '../viewmodels/GameVM';
import SendChat from './socket/SendChat';
import GameMessage from './socket/GameMessage';
import JoinGame from './socket/JoinGame';
import LeaveGame from './socket/LeaveGame';
import ResignRequest from './socket/ResignRequest';
import ResignResponse from './socket/ResignResponse';
import EndHandQuestion from './socket/EndHandQuestion';
import EndHandResponse from './socket/EndHandResponse';
import UpdateGame from './socket/UpdateGame';
import Disconnect from './socket/Disconnect';

export default class Play {
    constructor(io, playGame) {
        const mapper = new GameVM();
        this.handlers = [];
        io.on('connection', (socket => {
            // message handler for the chat message
            this.handlers.push(new SendChat(socket, playGame));

            // message handler for messages from the game
            this.handlers.push(new GameMessage(socket, playGame));

            // message handler for join game message
            this.handlers.push(new JoinGame(socket, playGame, mapper));

            // message handler for the leave game message
            this.handlers.push(new LeaveGame(socket, playGame, mapper));

            // message handler for the leave game message
            this.handlers.push(new ResignRequest(socket, playGame));

            // message handler for the leave game message
            this.handlers.push(new ResignResponse(socket, playGame, mapper));

            // message handler for the end hand question
            this.handlers.push(new EndHandQuestion(socket, playGame));

            // message handler for the end hand question
            this.handlers.push(new EndHandResponse(socket, playGame, mapper));

            // message handler for update cards message
            this.handlers.push(new UpdateGame(socket, playGame, mapper));

            // message handler for disconnect
            this.handlers.push(new Disconnect(socket, playGame, mapper));
        }).bind(this));
    }
}
