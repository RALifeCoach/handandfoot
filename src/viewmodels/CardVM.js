const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitsCard = ['clubs', 'diams', 'hearts', 'spades', 'joker'];

export class CardVM {
  constructor(card) {
    if (typeof card.cardNumber === 'undefined') {
      this.suit = card.suit;
      this.number = card.number;
    } else {
      this.suit = card.suitNumber;
      this.number = card.cardNumber;
    }
  }

  deserialize() {
    return {
      suitNumber: this.suit,
      cardNumber: this.number,
      suitCard: suitsCard[this.suit],
      number: this.number > -1 ? cards[this.number] : -1
    }
  }

  serialize() {
    return {
      suit: this.suit,
      number: this.number,
    }
  }
}
