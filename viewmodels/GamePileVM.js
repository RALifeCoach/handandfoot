import * as CardPileVM from './CardPileVM';

export class GamePileVM {
  constructor(direction, inPile) {
    this.direction = direction;
    this.cardPile = new CardPileVM.CardPileVM(inPile);
  }
  get cards() { return this.cardPile.cards }

  deserialize() {
    return {
      direction: direction,
      cards: cardPile.deserialize()
    }
  }
  serialize() {
    return {
      direction: direction,
      cards: cardPile.serialize()
    }
  }
}
