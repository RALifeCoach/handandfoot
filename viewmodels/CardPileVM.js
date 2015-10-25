import * as CardVM from './CardVM';

export class CardPileVM {
  constructor(inPile) {
    this.cardPile = [];

    if (inPile) {
      inPile.forEach(card => this.cardPile.push(new CardVM.CardVM(card)));
    }
  }
  get cards() { return this.cardPile }

  deserialize() {
    let outCards = [];

    this.cardPile.forEach(card => outCards.push(card.deserialize()));

    return outCards;
  }
  serialize() {
    let outCards = [];

    this.cardPile.forEach(card => outCards.push(card.serialize()));

    return outCards;
  }
}
