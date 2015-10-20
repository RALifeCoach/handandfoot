import * as CardVM from './CardVM';

export class CardPileVM {
  constructor(inPile) {
    this.cards = [];

    if (inPile) {
      inPile.forEach(card => this.cards.push(new CardVM.CardVM(card)));
    }
  }
  deserialize() {
    let outCards = [];

    this.cards.forEach(card => outCards.push(card.deserialize()));

    return outCards;
  }
  serialize() {
    let outCards = [];

    this.cards.forEach(card => outCards.push(card.serialize()));

    return outCards;
  }
}
