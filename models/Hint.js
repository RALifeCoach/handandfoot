var mongoose = require('mongoose');

var HintSchema = new mongoose.Schema({
	hint: String
});

mongoose.model('Hint', HintSchema);
