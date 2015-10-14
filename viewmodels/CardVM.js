const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitsCard = ['clubs', 'diams', 'hearts', 'spades', 'joker'];

export class CardVM {
  constructor(card) {
    this.suit = card.suit;
    this.number = card.number;
  }

  deserialize() {
    return {
      suitNumber: this.suit,
      cardNumber: this.number,
      suitCard: suitsCard[this.suit],
      number: this.number > -1 ? cards[this.number] : -1
    }
  }
}
