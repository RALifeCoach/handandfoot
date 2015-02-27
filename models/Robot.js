var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RobotSchema = new mongoose.Schema({
	_id: String,
	player: {
		position: Number,
		inFoot: Boolean,
		handCards: [{
			suit: Number,
			number: Number
		}],
		footCards: [{
			suit: Number,
			number: Number
		}]
	},
	control: {
		round: Number,
		turn: Boolean,
		turnState: String,
		drawCards: Number, // the number of cards to draw after playing red threes
	},
	gameMessages: [],
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
	redThrees: Number,
	otherPlayers: [new Schema({
		turn: Boolean,
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
		redThrees: Number,
		score: Number
	})],
	discardPile: {
		cards: [{
			suit: Number,
			number: Number
		}]
	}
});

mongoose.model('Robot', RobotSchema);
