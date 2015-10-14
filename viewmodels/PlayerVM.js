import * as CardPileVM from './CardPileVM';

export class PlayerVM {
  constructor(person) {
    if (!person) {
      this.person = false;
      return;
    }

    this.person = {
      id: person.id,
      name: person.name
    };
  }
  loadPlayer(player) {
    this.direction = player.direction;
    this.connected = player.connected;
    this.turn = false;
    this.footCards = new CardPileVM.CardPileVM(player.footCards);
    this.handCards = new CardPileVM.CardPileVM(player.handCards);
    this.inFoot = player.handCards.length === 0;
  }

  get name() { return this.person.name }
  get hasPerson() { return this.person !== false }
}
