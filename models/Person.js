var mongoose = require('mongoose');

var StatsSchema = new mongoose.Schema({
	game: String,
	dateEnded: { type: Date, default: Date.now },
	yourScore: { type: Number, default: 0},
	theirScore: { type: Number, default: 0}
});

var PersonSchema = new mongoose.Schema({
	name: String,
	userId: String,
	password: String,
	stats: [ StatsSchema ]
});

mongoose.model('Person', PersonSchema);
