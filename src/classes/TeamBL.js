export default class TeamBL {
    constructor(team) {
        this.cardScores = [20, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 20];
        if (team) {
            this.team = team;
        } else {
            let player = {person: [], direction: '', handCards: [], footCards: []};
            this.team = {score: 0, players: [player, player], melds: []};
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

    // score the team
    scoreTeam(winningTeam) {
        var scores = {
            baseScore: 0,
            cardsScore: 0,
            priorScore: 0
        };

        // add 100 points for going out first
        if (this.team === winningTeam)
            scores.baseScore += 100;

        // score the team's melds
        this.team.melds.forEach(meld => {
            if (meld.type === 'Red Three') {
                scores.baseScore += 100;
            } else {
                switch (meld.type) {
                    case 'Clean Meld':
                        scores.baseScore += meld.isComplete ? 500 : 0;
                        break;
                    case 'Dirty Meld':
                        scores.baseScore += meld.isComplete ? 300 : 0;
                        break;
                    case 'Run':
                        scores.baseScore += meld.isComplete ? 2000 : -2000;
                        break;
                    case 'Wild Card Meld':
                        scores.baseScore += meld.isComplete ? 1000 : -1000;
                        break;
                }

                // score the cards in the meld
                meld.cards.forEach(card => {
                    if (card.suit === 4)
                        scores.cardsScore += 50;
                    else
                        scores.cardsScore += this.cardScores[card.number];
                });
            }
        });

        // now score the cards left in players hands
        this.team.players.forEach(player => {
            for (var handIndex = 0; handIndex < 2; handIndex++) {
                var cards = handIndex === 0 ? player.handCards : player.footCards;
                cards.forEach(card => {
                    if (card.suit === 4)
                        scores.cardsScore -= 50;
                    else if (card.number === 2
                        && (card.suit === 1 || card.suit === 2))
                    // red three
                        scores.cardsScore -= 100;
                    else
                        scores.cardsScore -= this.cardScores[card.number];
                });
            }
        });

        scores.priorScore = this.team.score;
        this.team.score += scores.baseScore + scores.cardsScore;

        return scores;
    }
}
