var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OptionsSchema = new Schema({
	teams: Number,
	roundScores: [ 
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
	currentPlayer: { type: Number, default: 0 },
	gameBegun: { type: Boolean, default: false },
	gameComplete: { type: Boolean, default: false },
	turn: { type: Number, default: 0},
	turnState: { type: String, default: ''},
	drawCards: { type: Number, default: 0}, // the number of cards to draw after playing red threes
	teams: [{
		score: Number,
		redThrees: Number,
		melds: [new Schema({
			type: String,
			number: Number,
			isComplete: Boolean,
			cards: [{
				suit: Number,
				number: Number
			}]
		})],
		players: [new Schema({
			personOffset: Number,
			position: Number,
			connected: Boolean,
			handCards: [{
				suit: Number,
				number: Number
			}],
			footCards: [{
				suit: Number,
				number: Number
			}]
		})],
		results: [new Schema({
			round: Number,
			baseScore: Number,
			cardsScore: Number,
			priorScore: Number
		})]
	}],
	drawPiles: [{
		cards: [{
			suit: Number,
			number: Number
		}]
	}],
	discardPile: {
		cards: [{
			suit: Number,
			number: Number
		}]
	},
	numberOfPlayers: Number,
	people: [ {type: Schema.Types.ObjectId, ref: 'Person' }]
});

mongoose.model('Game', GameSchema);
