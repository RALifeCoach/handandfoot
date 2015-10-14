const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitsCard = ['clubs', 'diams', 'hearts', 'spades', 'joker'];

export class CardVM {
  constructor(card) {
    this.suitNumber = card.suit;
    this.cardNumber = card.number;
    this.suitCard = suitsCard[card.suit];
    this.number = card.number > -1 ? cards[card.number] : -1;
  }

  deserialize() {
    return {
      suit: this.suitNumber,
      number: this.cardNumber
    }
  }
}
