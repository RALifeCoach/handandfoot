'use strict';

var mongoose = require('mongoose');
var Robot = mongoose.model('Robot');
var robotDrawCard = require('./robotDrawCard');
var robotAnalizeHand = require('./robotAnalizeHand');
var robotPlayCards = require('./robotPlayCards');
var robotDiscardCard = require('./robotDiscardCard');
var robotCommon = require('./robotCommon');

module.exports = (function(pEventHandler) {
	var robotMain = {
	};
	
	robotMain.getRobot = function(id, callback) {
		Robot.findById(id, function(err, robot) {
			if (err) {
				console.log('error fetching robot: ' + id);
				console.log(err.stack);
				return callback(err);
			}
			callback(null, robot);
		});
	};
	
	robotMain.updateRobot = function(data, robot, id, callback) {
		console.log('robot game update');
		
		// update robot information - if it doesn't exist then create it
		if (!robot) {
			robot = new Robot({
				_id: id
				, player: {}
				, control: {}
				, gameMessages: []
			});
		}
		
		// load 'my' values
		robot.player.position = data.players[0].position;
		robot.player.handCards = robotCommon.copyCards(data.players[0].handCards);
		robot.player.footCards = robotCommon.copyCards(data.players[0].footCards);
		robot.player.inFoot = data.players[0].handCards.length === 0;
		robot.player.name = data.players[0].person.name;
		robot.melds = data.teams[0].melds;
		robot.score = data.teams[0].score;
		robot.redThrees = data.teams[0].redThrees;
		robot.control.round = data.game.round;
		robot.control.turn = data.players[0].turn;
		robot.control.turnState = data.game.turnState;
		robot.control.drawCards = data.game.drawCards;
		robot.otherPlayers = [];
		robot.otherTeams = [];
		robot.discardPile = {
			cards: robotCommon.copyCards(data.game.discardPile.cards)
		};
		robot.drawPiles = data.game.drawPiles;
		
		var teamCount = data.teams.length;
		var teamIndex = data.players[0].teamIndex;
		for (var playerIndex = 1; playerIndex < data.players.length; playerIndex++) {
			var player = data.players[playerIndex];
			var playerTeamIndex = player.teamIndex - teamIndex;
			if (playerTeamIndex < 0)
				playerTeamIndex += teamCount; 
			robot.otherPlayers.push({
				turn: player.turn,
				teamIndex: playerTeamIndex,
				position: player.position,
				handCards: player.handCards,
				footCards: player.footCards
			});
		}
		for (var teamIndex = 1; teamIndex < data.teams.length; teamIndex++) {
			var team = data.teams[teamIndex];
			robot.otherTeams.push({
				melds: team.melds,
				redThrees: team.redThrees,
				score: team.score
			});
		}
		
		robot.save(function(err) {
			if (err) {
				console.log('error inserting/updating robot');
				console.log(robot);
				console.log(err.stack);
				return callback(err);
			}

			callback(null, robot);
		});
	};
	
	// draw a card
	robotMain.drawACard = function(robot) {
		console.log('draw a cardNumber');
		return robotDrawCard.drawACard(robot);
	}
	
	// draw a card from a draw pile
	robotMain.drawFromPile = function(robot) {
		console.log('drawFromPile');
		return robotDrawCard.drawFromPile(robot);
	}
	
	// play cards
	robotMain.playCards = function(robot) {
		console.log('drawFromPile');
		robotAnalizeHand.analizeHand(robot);
		
		robotPlayCards.playCards(robot);
		
		return robotDiscardCard.discardCard(robot);
	}
	
	return robotMain;
})();