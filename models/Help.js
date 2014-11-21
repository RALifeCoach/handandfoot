var mongoose = require('mongoose');

var HelpTextSchema = new mongoose.Schema({
	helpText: String
}, {collection: 'HelpText'});

mongoose.model('HelpText', HelpTextSchema);
