var mongoose = require('mongoose');

var StatsSchema = new mongoose.Schema({
	gameId: String,
	gameName: String,
	dateEnded: { type: Date, default: Date.now },
	status: String,
	roundsPlayed: Number,
	yourTeam: {
		partner: {
			personId: String,
			name:String
		},
		score: Number
	},
	theirTeam: {
		player1: {
			personId: String,
			name:String
		},
		player2: {
			personId: String,
			name:String
		},
		score: Number
	}
});

var PersonSchema = new mongoose.Schema({
	name: String,
	userId: String,
	password: String,
	stats: [ StatsSchema ]
});

mongoose.model('Person', PersonSchema);
