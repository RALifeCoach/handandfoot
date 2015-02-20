'use strict';

var mongoose = require('mongoose');
var Game = mongoose.model('Game');

module.exports = (function(eventHandler) {
	eventHandler.on('gameUpdate', gameUpdate);

	function gameUpdate(data) {
		console.log('robot received game update');
	}
});