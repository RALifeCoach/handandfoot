export class Team {
  constructor(team) {
    if (team) {
      this.team = team;
    } else {
      let player = { person: [], direction: '', handCards: [], footCards: []};
      this.team = { score: 0, players: [player, player], melds: [] };
    }
  }

  get score() {
    return this.team.score;
  }

  get melds() {
    return this.team.melds;
  }

  get name() {
    return this.player.person.length > 0
      ? this.player.persob[0].name
      : false;
  }
}
