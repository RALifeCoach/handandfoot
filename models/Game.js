var mongoose = require('mongoose');

var CardSchema = new mongoose.Schema({
	suit: Number,
	number: Number
});

var PileSchema = new mongoose.Schema({
	direction: String,
	cards: [ CardSchema ]
});

var MeldSchema = new mongoose.Schema({
	type: String,
	number: Number,
	isComplete: { type: Boolean, default: false },
	cards: [ CardSchema ]
});

var PlayerSchema = new mongoose.Schema({
	person: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Person' }],
	direction: String,
	connected: { type: Boolean, default: false },
	handCards: [ CardSchema ],
	footCards: [ CardSchema ]
});

var TeamSchema = new mongoose.Schema({
	score: Number,
	melds: [ MeldSchema ],
	players: [ PlayerSchema ]
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
	nsTeam: [ TeamSchema ],
	ewTeam: [ TeamSchema ],
	piles: [ PileSchema ],
	gameBegun: { type: Boolean, default: false },
	gameComplete: { type: Boolean, default: false }
});

mongoose.model('Game', GameSchema);
