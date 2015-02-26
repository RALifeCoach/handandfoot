'use strict';

var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var events = require('events');
var eventHandler = events.EventEmitter();

module.exports = function(gameId, position) {
	var robot = {
		id: gameId + 'p' + position
	};
	
	robot.emit = function(messageType) {
		switch (messageType) {
			case 'gameUpdate':
				break;
			case 'chatUpdate':
				break;
			case 'endHandQuestion':
				break;
			case 'endHandResponse':
				break;
			case 'resignRequest':
				break;
			case 'resignResponse':
				break;
			default:
				ggggg = ooooo;
		}
	};
	
	return robot;
};