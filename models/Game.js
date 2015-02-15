var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OptionsSchema = new Schema({
	teams: Number,
	runScores: [ 
		{
			score: Number,
			sevenRule: Boolean
		}
	],
	cardScores: [ Number ],
	redThreeScore: Number,
	redThreeNegative: Boolean,
	allowRuns: Boolean,
	allowWildCardMelds: Boolean,
	allowPickupFromPile: Boolean,
	decks: Number,
	dirtyMeldScore: Number,
	cleanMeldScore: Number,
	runScore: Number,
	wildCardMeldScore: Number,
	discardPickupCount: Number
});

var GameSchema = new mongoose.Schema({
	name: String,
	password: String,
	startDate: { type: Date, default: Date.now },
	lastPlayedDate: { type: Date, default: Date.now },
	round: { type: Number, default: 0},
	roundStartingPlayer: { type: Number, default: 0},
	turn: { type: Number, default: 0},
	turnState: { type: String, default: ''},
	drawCards: { type: Number, default: 0}, // the number of cards to draw after playing red threes
	teams: [{
		score: Number,
		melds: {
			type: String,
			number: Number,
			isComplete: { type: Boolean, default: false },
			cards: [ {
				suit: Number,
				number: Number
			}]
		},
		players: [{
			personOffset: Number,
			direction: String,
			connected: { type: Boolean, default: false },
			handCards: [{
				suit: Number,
				number: Number
			}],
			footCards: [{
				suit: Number,
				number: Number
			}]
		}]
	}],
	piles: [{
		direction: String,
		cards: [{
			suit: Number,
			number: Number
		}]
	}],
	roundsPlayed: [{
		round: Number,
		teams: [{
			baseScore: Number,
			cardsScore: Number,
			priorScore: Number
		}]
	}],
	gameBegun: { type: Boolean, default: false },
	gameComplete: { type: Boolean, default: false },
	people: [ type: type: Schema.Types.ObjectId, ref: 'Person' }]
});

mongoose.model('Game', GameSchema);
