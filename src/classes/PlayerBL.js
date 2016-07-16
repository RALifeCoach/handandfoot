export default class PlayerBL {
    constructor(direction, turn, player) {
        this.player = player;
        this.player.turn = turn;
        this.player.direction = direction;
    }

    get personId() {
        return this.player.person.length > 0
            ? this.player.person[0] : false
    }

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

    get connected() {
        return this.player.connected
    }

    get direction() {
        return this.player.direction
    }

    get handCards() {
        return this.player.handCards
    }

    get footCards() {
        return this.player.footCards
    }

    get turn() {
        return this.player.turn
    }

    set connected(value) {
        this.player.connected = value
    }

    addPerson(personId) {
        this.player.connected = true;
        if (this.player.person.length === 0)
            this.player.person.push(personId);
    }

    updateHands(playerVM) {
        if (playerVM.footCards) {
            this.player.footCards = playerVM.footCards.serialize();
        }
        if (playerVM.handCards) {
            this.player.handCards = playerVM.handCards.serialize();
        }
    }
}
