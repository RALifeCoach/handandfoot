

// build the stats
export function buildStats(gameData, direction, youResigned, theyResigned) {
  // build the fields needed to get the stats
  var yourScore, yourPartner, theirScore, opponent1, opponent2, personId, status;
  switch (direction) {
    case 'North':
      personId = gameData.people[0].id;
      yourScore = gameData.nsTeam.score;
      yourPartner = gameData.people[2];
      theirScore = gameData.ewTeam.score;
      opponent1 = gameData.people[1];
      opponent2 = gameData.people[3];
      break;
    case 'South':
      personId = gameData.people[2].id;
      yourScore = gameData.nsTeam.score;
      yourPartner = gameData.people[0];
      theirScore = gameData.ewTeam.score;
      opponent1 = gameData.people[1];
      opponent2 = gameData.people[3];
      break;
    case 'East':
      personId = gameData.people[1].id;
      yourScore = gameData.ewTeam.score;
      yourPartner = gameData.people[3];
      theirScore = gameData.nsTeam.score;
      opponent1 = gameData.people[0];
      opponent2 = gameData.people[2];
      break;
    case 'West':
      personId = gameData.people[3].id;
      yourScore = gameData.ewTeam.score;
      yourPartner = gameData.people[1];
      theirScore = gameData.nsTeam.score;
      opponent1 = gameData.people[0];
      opponent2 = gameData.people[2];
      break;
  }

  if (youResigned)
    status = "loss";
  else if (theyResigned)
    status = "win";
  else if (yourScore > theirScore)
    status = "win";
  else if (yourScore < theirScore)
    status = "loss";
  else
    status = "tie";

  // build the stats for the game
  let results = {
    stat: {
      gameName: gameData.game.name,
      gameId: gameData.game._id,
      status: status,
      roundsPlayed: gameData.game.round,
      yourTeam: {
        partner: {
          personId: yourPartner.id,
          name: yourPartner.name
        },
        score: youResigned ? -99999 : yourScore,
      },
      theirTeam: {
        player1: {
          personId: opponent1.id,
          name: opponent1.name
        },
        player2: {
          personId: opponent2.id,
          name: opponent2.name
        },
        score: theyResigned ? -99999 : theirScore
      }
    },
    personId: personId
  };
  return results;
}

// score the game
export function score(gameData, winningTeam) {
  let game = gameData.game;

  var results = {
    nsTeam: {	},
    ewTeam: {	}
  };

  for (var teamIndex = 0; teamIndex < 2; teamIndex++) {
    var team, scores;
    if (teamIndex === 0) {
      team = game.nsTeam;
      results.nsTeam = team.scoreTeam();
    } else {
      team = game.ewTeam;
      results.ewTeam = team.scoreTeam();
    }
  }

  var roundPlayed = {
    round: game.round,
    nsTeam: [
      results.nsTeam
    ],
    ewTeam: [
      results.ewTeam
    ]
  };
  game.roundsPlayed.push(roundPlayed);
  return results;
}
