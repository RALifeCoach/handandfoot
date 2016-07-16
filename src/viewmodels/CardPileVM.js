import CardVM from './CardVM';

export default class CardPileVM {
    constructor(inPile) {
        this.cardPile = [];

        if (inPile) {
            this.cardPile = inPile.map(card => {
                return new CardVM(card);
            });
        }
    }

    get cards() {
        return this.cardPile
    }

    deserialize() {
        return this.cardPile.map(card => {
            return card.deserialize();
        });
    }

    serialize() {
        return this.cardPile.map(card => {
            return card.serialize();
        });
    }
}
