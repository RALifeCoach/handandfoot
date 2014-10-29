var mongoose = require('mongoose');

var PersonSchema = new mongoose.Schema({
  name: String,
  userId: String,
  password: String,
  wins: {type: Number, default: 0},
  losses: {type: Number, default: 0},
  games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
});

PersonSchema.methods.recordWin = function(person) {
  this.wins += 1;
  person.Save();
};

PersonSchema.methods.recordLoss = function(person) {
  this.losses += 1;
  person.Save();
};

mongoose.model('Person', PersonSchema);
