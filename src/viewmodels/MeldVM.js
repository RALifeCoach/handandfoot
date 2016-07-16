import CardPileVM from './CardPileVM';

export default class MeldVM {
    constructor(meld) {
        this.type = meld.type;
        this.number = meld.number;
        this.isComplete = meld.isComplete;
        this.meldId = meld._id;
        this.cards = new CardPileVM(meld.cards);
    }

    deserialize() {
        return {
            _id: this.meldId,
            type: this.type,
            number: this.number,
            isComplete: this.isComplete,
            cards: this.cards.deserialize()
        }
    }
}
