var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RobotSchema = new mongoose.Schema({
	_id: String,
	player: {
		position: Number,
		nme: String,
		inFoot: Boolean,
		handCards: [{
			suitNumber: Number,
			cardNumber: Number
		}],
		footCards: [{
			suitNumber: Number,
			cardNumber: Number
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
			suitNumber: Number,
			cardNumber: Number
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
				suitNumber: Number,
				cardNumber: Number
			}]
		})],
		redThrees: Number,
		score: Number
	})],
	discardPile: {
		cards: [{
			suitNumber: Number,
			cardNumber: Number
		}]
	}
});

mongoose.model('Robot', RobotSchema);
