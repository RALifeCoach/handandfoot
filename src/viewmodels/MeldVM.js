import * as CardPileVM from './CardPileVM';

export class MeldVM {
  constructor(meld) {
    this.type = meld.type;
    this.number = meld.number;
    this.isComplete = meld.isComplete;
    this.cards = new CardPileVM.CardPileVM(meld.cards);
  }
}
