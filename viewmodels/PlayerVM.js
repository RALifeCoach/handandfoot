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
    this.turn = player.turn;
    this.footCards = (new CardPileVM.CardPileVM(player.footCards));
    this.handCards = (new CardPileVM.CardPileVM(player.handCards));
    this.inFoot = player.handCards.length === 0;
  }

  get name() { return this.person.name }
  get hasPerson() { return this.person !== false }
  get hand() {
    return this.inFoot ? this.footCards : this.handCards;
  }

  deserialize() {
    return {
      person: {
        id: this.person.id,
        name: this.person.name
      },
      direction: this.direction,
      connected: this.connected,
      turn: this.turn,
      footCards: this.footCards.deserialize(),
      handCards: this.handCards.deserialize(),
      inFoot: this.inFoot,
      myUpdate: false
    }
  }
}
