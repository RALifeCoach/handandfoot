import CardPileVM from './CardPileVM';

export default class MeldVM {
    constructor(meld) {
        this.type = meld.type;
        this.number = meld.number;
        this.isComplete = meld.isComplete;
        this.cards = new CardPileVM(meld.cards);
    }
}
