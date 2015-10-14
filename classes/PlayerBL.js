export class Player {
  constructor(direction, player) {
    this.player = player;
    this.player.direction = direction;
  }

  get personId() { return this.player.person.length > 0
    ? this.player.person[0] : false }

  get hand() {
    return this.player.handCards.length > 0
      ? this.player.handCards
      : this.player.footCards;
  }

  get inFoot() {
    if (this.player.handCards.length === 0 && this.player.footCards.length === 0)
      return false;

    return this.player.handCards.length === 0;
  }

  get connected() { return this.player.connected }

  get handCards() { return this.player.handCards }

  get footCards() { return this.player.footCards }

  set connected(value) { this.player.connected = value }

  addPerson(personId) {
		this.player.connected = true;
    if (this.player.person.length === 0)
			this.player.person.push(personId);
  }
}
