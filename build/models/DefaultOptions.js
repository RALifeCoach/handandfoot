'use strict';

var mongoose = require('mongoose');

var DefaultOptionsSchema = new mongooseSchema({
	teams: Number,
	runScores: [new Schema({
		score: Number,
		sevenRule: Boolean
	})],
	cardScores: [Number],
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

mongoose.model('DefaultOptions', DefaultOptionsSchema);