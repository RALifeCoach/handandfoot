import CardPileVM from './CardPileVM';

export default class GamePileVM {
    constructor(direction, inPile) {
        this.direction = direction;
        this.cardPile = new CardPileVM(inPile);
    }

    get cards() {
        return this.cardPile.cards
    }

    deserialize() {
        return {
            direction: direction,
            cards: this.cardPile.deserialize()
        };
    }

    serialize() {
        return {
            direction: direction,
            cards: this.cardPile.serialize()
        };
    }
}
