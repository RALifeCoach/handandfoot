var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RobotSchema = new mongoose.Schema({
	_id: String,
	position: Number,
	handCards: [{
		suit: Number,
		number: Number
	}],
	footCards: [{
		suit: Number,
		number: Number
	}],
	melds: [new Schema({
		type: String,
		number: Number,
		isComplete: Boolean,
		cards: [{
			suit: Number,
			number: Number
		}]
	})],
	score: Number,
	otherPlayers: [new Schema({
		teamIndex: Number,
		position: Number,
		handCards: Number,
		footCards: Number
	})],
	otherTeams: [new Schema({
		melds: [new Schema({
			type: String,
			number: Number,
			isComplete: Boolean,
			cards: [{
				suit: Number,
				number: Number
			}]
		})],
		score: Number
	})],
});

mongoose.model('Robot', RobotSchema);
