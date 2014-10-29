var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Game = mongoose.model('Game');
var Person = mongoose.model('Person');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;

router.post('/login', function(req, res, next) {
  var query = Person.findOne( {userId: req.body.userId} );
  query.exec(function (err, person){
    if (err) { return next(err); }
    if (!person) {
		console.log('user not found');
		console.log(req.body);
		return next(new Error("user id/password invalid"));
	}
	
	if (person.password !== req.body.password) {
		console.log('password does not match');
		console.log(req.body);
		console.log(person);
		return next(new Error("user id/password invalid"));
	}
	
    res.json({error: false, person: person });
  });
});

router.post('/register', function(req, res, next) {
	var query = Person.findOne( {userId: req.body.userId} );

	if (req.body.password !== req.body.confirmPassword) {
		res.json( {error: 'password and confirm password do not agree'} );
		return;
	}

	if (req.body.password.length < 2) {
		res.json( {error: 'password must be at least 6 characters long'} );
		return;
	}

	query.exec(function (err, person){
		if (err) { return next(err); }
		if (person) { 
			res.json( {error: 'user id already exists'} );
			return;
		}

		person = new Person( req.body );
		person.save();
		res.json( {error: false, person: person } );
	});
});
