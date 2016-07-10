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
var PlayGame = require('./classes/PlayGame');
var playGame = new PlayGame();

var io = require('socket.io')(server);

// include routes
import People from './routes/People';
var people = new People();
var Games = require('./routes/Games');
var games = new Games.Router(io);
var Play = require('./routes/Play');
var play = new Play.Router(io, playGame);

// view engine setup
app.set('views', '/git/handandfoot/views');
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('/git/handandfoot/public'));
app.use('/bower_components',  express.static('/git/handandfoot/bower_components'));
app.use('/angular',  express.static('/git/handandfoot/angular'));
app.use('/partials',  express.static('/git/handandfoot/views/partials'));

app.use('/', people);
app.use('/games', games);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(new Error('404 for ' + req.path));
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
        res.status = err.status || 500;
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
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
