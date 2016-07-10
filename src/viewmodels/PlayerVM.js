import CardPileVM from './CardPileVM';

export default class PlayerVM {
    constructor(person) {
        if (!person) {
            this.person = false;
            return;
        }

        this.person = {
            id: person.id,
            name: person.name
        };
    }

    loadPlayer(player) {
        this.direction = player.direction;
        this.connected = player.connected;
        this.turn = player.turn;
        this.footCards = player.inFoot ? new CardPileVM(player.cards) : null;
        this.handCards = player.inFoot ? null : new CardPileVM(player.cards);
        this.inFoot = player.inFoot;
    }

    get name() {
        return this.person.name
    }

    get hasPerson() {
        return this.person !== false
    }

    get hand() {
        return this.inFoot ? this.footCards : this.handCards;
    }

    deserialize() {
        return {
            person: {
                id: this.person.id,
                name: this.person.name
            },
            direction: this.direction,
            connected: this.connected,
            turn: this.turn,
            cards: this.inFoot
                ? this.footCards.deserialize()
                : this.handCards.deserialize(),
            inFoot: this.inFoot,
            myUpdate: false
        }
    }
}
