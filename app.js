var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
var app = express();
var server = http.createServer(app);

var port = process.env.PORT || 3010;

// connect to database
mongoose.connect('mongodb://localhost/ra_prod_database');

// include models
require('./models/Person');
require('./models/Game');
require('./models/Hint');
require('./models/Help');

// define classes
var PlayGame = require('./classes/playGame');
var playGame = new PlayGame.PlayGame();
var GameVM = require('./viewmodels/GameVM');
var gameMapper = new GameVM.GameVM();
var PersonVM = require('./viewmodels/PersonVM');
var personMapper = new PersonVM.PersonVM();

var io = require('socket.io')(server);

// include routes
var people = require('./routes/person')(personMapper);
var games = require('./routes/game')(io, gameMapper);
var play = require('./routes/play')(io, playGame, gameMapper);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/angular',  express.static(__dirname + '/angular'));
app.use('/partials',  express.static(__dirname + '/views/partials'));

app.use('/', people);
app.use('/games', games);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// Start Server
server.listen(port, "0.0.0.0");
server.on('listening', function () {
    console.log('Express server started on port %s at %s', server.address().port, server.address().address);
});
