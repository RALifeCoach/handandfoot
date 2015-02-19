var mongoose = require('mongoose');

var StatsSchema = new mongoose.Schema({
	gameName: String,
	dateEnded: { type: Date, default: Date.now },
	status: String,
	roundsPlayed: Number,
	teams: [{
		players: [{
			name:String
		}],
		score: Number
	}]
});

var PersonSchema = new mongoose.Schema({
	name: String,
	userId: String,
	password: String,
	stats: [ StatsSchema ]
});

mongoose.model('Person', PersonSchema);
