import mongoose from 'mongoose';
import * as gameUtil from '../src/classes/game/GameUtil';

function clearDB(done) {
  let collectionCtr = 0;
  for (var i in mongoose.connection.collections) {
    collectionCtr++;
    mongoose.connection.collections[i].remove(function() {
      if (--collectionCtr === 0) {
        return done();
      }
    });
  }
  if (collectionCtr === 0) {
    return done();
  }
}

export function dbBefore(done) {
  if (mongoose.connection.readyState === 0) {
    mongoose.connect('mongodb://localhost/test', function (err) {
      if (err) {
        throw err;
      }
      return clearDB(done);
    });
  } else {
    return clearDB(done);
  }
}

export function dbAfter(done) {
  mongoose.disconnect();
  done();
}

export function gameAndFourPlayers() {
  let DbPerson = mongoose.model('Person');

  return new Promise((resolve, reject) => {
    let dbPersonNorth = new DbPerson({name: 'test north'});
    dbPersonNorth.save((err, personNorth) => {
      if (err) { return console.log(err.stack); }
      let dbPersonSouth = new DbPerson({name: 'test south'});
      dbPersonSouth.save((err, personSouth) => {
        if (err) { return console.log(err.stack); }
        let dbPersonEast = new DbPerson({name: 'test east'});
        dbPersonEast.save((err, personEast) => {
          if (err) { return console.log(err.stack); }
          let dbPersonWest = new DbPerson({name: 'test west'});
          dbPersonWest.save((err, personWest) => {
            if (err) { return console.log(err.stack); }
            gameUtil.createGame('test game', '')
            .then(game => {
              return game.save();
            })
            .then(game => {
              let results = {
                game: game,
                north: personNorth,
                south: personSouth,
                east: personEast,
                west: personWest
              };
              resolve(results);
            })
            .catch(err => {
              console.log(err.stack);
              done();
            });
          });
        });
      });
    });
  });
}

export function buildPlayer(turn) {
  return {
    direction: 'North',
    connected: true,
    turn: turn,
    footCards: [
      {
        suitNumber: 0,
        cardNumber: 2,
        suitCard: 'clubs',
        number: '4',
        highlight: false
      },
    ],
    handCards: [
      {
        suitNumber: 0,
        cardNumber: 2,
        suitCard: 'clubs',
        number: '4',
        highlight: false
      },
    ],
    inFoot: false,
    myUpdate: true
  };
}

export function buildCompleteMelds(redThree, clean, dirty, run, wild) {
  let melds = [];
  if (redThree) {
    for (let meldIndex = 0; meldIndex < redThree; meldIndex++) {
      melds.push({
        type: 'Red Three',
        number: 0,
        isComplete: true,
        cards: []
      })
    }
  }
  if (clean) {
    for (let meldIndex = 0; meldIndex < clean; meldIndex++) {
      melds.push({
        type: 'Clean Meld',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }
  if (dirty) {
    for (let meldIndex = 0; meldIndex < dirty; meldIndex++) {
      melds.push({
        type: 'Dirty Meld',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }
  if (run) {
    for (let meldIndex = 0; meldIndex < run; meldIndex++) {
      melds.push({
        type: 'Run',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }
  if (wild) {
    for (let meldIndex = 0; meldIndex < wild; meldIndex++) {
      melds.push({
        type: 'Wild Card Meld',
        number: 4,
        isComplete: true,
        cards: []
      })
    }
  }

  return melds;
}

export function buildInCompleteMelds(melds, clean, dirty, run, wild) {
  if (clean) {
    for (let meldIndex = 0; meldIndex < clean; meldIndex++) {
      melds.push({
        type: 'Clean Meld',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
  if (dirty) {
    for (let meldIndex = 0; meldIndex < dirty; meldIndex++) {
      melds.push({
        type: 'Dirty Meld',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
  if (run) {
    for (let meldIndex = 0; meldIndex < run; meldIndex++) {
      melds.push({
        type: 'Run',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
  if (wild) {
    for (let meldIndex = 0; meldIndex < wild; meldIndex++) {
      melds.push({
        type: 'Wild Card Meld',
        number: 4,
        isComplete: false,
        cards: []
      })
    }
  }
}
