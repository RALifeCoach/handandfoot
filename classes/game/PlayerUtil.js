import * as personBL from '../PersonBL';
import * as handUtil from './HandUtil';

export function addPlayer(gameData, personId, direction) {
  let _this = this;
  return new Promise((resolve, reject) => {
    let player;
    switch (direction) {
      case 'North':
        player = gameData.players[0];
        break;
      case 'South':
        player = gameData.players[2];
        break;
      case 'East':
        player = gameData.players[1];
        break;
      case 'West':
        player = gameData.players[3];
        break;
    }

    player.addPerson(personId);

    // save the game
    personBL.loadPerson(personId)
    .then(person => {
      switch (direction) {
        case 'North':
          gameData.people[0] = person;
          break;
        case 'South':
          gameData.people[2] = person;
          break;
        case 'East':
          gameData.people[1] = person;
          break;
        case 'West':
          gameData.people[3] = person;
          break;
      }

      let playerCtr = 0;
      gameData.people.forEach(person => {
        if (person) playerCtr++
      });
      if (playerCtr === 4 && !gameData.game.gameBegun) {
        handUtil.dealNewHand(gameData);
        handUtil.startNewHand(gameData);
      }

      resolve();
    })
    .catch(err => reject(err));
  });
}
