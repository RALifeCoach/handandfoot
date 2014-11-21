var mongoose = require('mongoose');

var HelpTextSchema = new mongoose.Schema({
	helpText: String
}, {collection: 'helpText'});

mongoose.model('HelpText', HelpTextSchema);
