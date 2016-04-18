var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var debug = require('debug')('ci_bot:server');

var routes = require('./routes/index');
var callback = require('./telegram/callback');
var UpdatesFetcher = require('./telegram/updatesFetcher');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/telegram_callback', callback);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var userStore = {};

new UpdatesFetcher(function (data, tellLastUpdateId) {
    //console.log(data.result);
    var updateId = 0;
    //try {
    data.result.forEach(function (el) {
        if (updateId < el.update_id) {
            updateId = el.update_id;
        }
        processChatCommand(el.message);
    });
    //} catch (e) {
    //    console.error(e);
    //}
    tellLastUpdateId(updateId);
}).start();

var telegramClient = require('./telegram/telegramClient');
var jenkinsClient = require('./jenkins/jenkinsClient');


function processChatCommand(message) {
    routeMessage(message, function (result) {

        if (typeof result === 'string') {
            result = {text: result};
        }

        telegramClient.method('sendMessage',
            Object.assign({chat_id: message.chat.id}, result),
            function (data) {
                if (data.ok) {
                    console.log('Sent message: ' + result.text + ' to chat: ' + message.chat.id);
                } else {
                    console.error(data);
                }
            }
        );
    });
}

function routeMessage(message, callback) {
    var command = getBotCommand(message);
    if (!command) {
        callback('Not a command');
        return;
    }
    switch (command) {
        case '/auth':
            return processAuth(message, callback);
        case '/run':
            return runJob(message, callback);
    }

    callback('Unknown command: ' + command);
}

function getBotCommand(message) {
    var command = null;
    message.entities && message.entities.forEach(function (entity) {
        if (entity.type === 'bot_command') {
            command = message.text.substr(entity.offset, entity.length);
            return false;
        }
    });

    return command;
}

function processAuth(message, callback) {
    var parts = message.text.split(' ');
    var url = parts[1];
    var username = parts[2];
    var token = parts[3];

    var credentials = {
        url: url,
        username: username,
        token: token
    };

    jenkinsClient.checkCredentials(
        credentials,
        function (data, err) {
            if (err) {
                callback('Auth error');
                return;
            }

            userStore[message.from.id] = credentials;

            var jobNames = data.jobs.map(function (job) {
                return '   * ' + job.name;
            }).join('\n');

            callback('Auth success. Available jobs: \n' + jobNames);
        }
    );
}

function runJob(message, callback) {
    var credentials = userStore[message.from.id];
    if (!credentials) {
        callback('Please run /auth command first.');
        return;
    }

    var jobName = message.text.split(' ')[1];

    if (!jobName) {
        callback('Usage: /run [build_name]');
        return;
    }

    jenkinsClient.runJob(credentials, jobName, function (err) {
        if (!err) {
            callback('Job \'' + jobName + '\' started');
        } else {
            callback('Job \'' + jobName + '\' not found');
        }
    });
}


module.exports = app;
