var UpdatesFetcher = require('./updatesFetcher');
var telegramClient = require('./telegramClient');
var jenkinsClient = require('../jenkins/jenkinsClient');
var fs = require('fs');

var getUserStore = require('../users/UserStore').get;

var TELEGRAM = 'telegram';

module.exports.start = function () {
    console.log('Starting telegram bot server...');

    new UpdatesFetcher(onUpdate, onError).start();

    console.log('Telegram bot server started.');
};

function onError(data) {
    console.log('Error: ' + data);
}

function onUpdate(data, tellLastUpdateId) {
    var updateId = 0;
    data.result.forEach(function (el) {
        if (updateId < el.update_id) {
            updateId = el.update_id;
        }
        processChatCommand(el.message);
    });

    tellLastUpdateId(updateId);
}

function processChatCommand(message) {
    console.log('Got message: \'' + message.text + '\' from user: ' + message.from.id + '(' + message.from.username + ')');
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
            processAuth(message, callback);
            break;

        case '/run':
            runJob(message, callback);
            break;

        case '/start':
            start(message, callback);
            break;

        case '/jobs':
            jobs(message, callback);
            break;

        case '/views':
            views(message, callback);
            break;

        default:
            callback('Unknown command: ' + command);
    }


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

function jobs(message, callback) {
    var view = message.text.split(' ')[1];
    var pathPrefix = '';
    if (view) {
        pathPrefix = '/view/' + view;
    }
    authenticate(message, function (credentials, err) {
        if (err) {
            callback(err);
        }

        jenkinsClient.callApi(credentials, pathPrefix + '/api/json', {tree: 'jobs[name]'}, function (data, err) {
            if (err) {
                console.log(err);
                callback('Command failed.');
            } else {
                var jobsNames = data.jobs.map((el) => ' * ' + el.name);
                var viewText = '';
                if (view) {
                    viewText = ' for view \'' + view + '\'';
                }
                callback('Jobs list' + viewText + ':\n' + jobsNames.join('\n'));
            }
        });
    });
}

function views(message, callback) {
    authenticate(message, function (credentials, err) {
        if (err) {
            callback(err);
        }

        jenkinsClient.callApi(credentials, '/api/json', {tree: 'views[name]'}, function (data, err) {
            if (err) {
                console.log(err);
                callback('Command failed.');
            } else {
                var viewsNames = data.views.map((el) => ' * ' + el.name);
                callback('Views list:\n' + viewsNames.join('\n'));
            }
        });
    });
}


function start(message, callback) {
    fs.readFile('./messages/start.html', 'utf8', function (err, data) {
        if (err) {
            callback('Hi!');
            return console.log(err);
        }
        callback({text: data, parse_mode: 'HTML'});
    });
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

            getUserStore().save(TELEGRAM, Object.assign({id: message.from.id}, credentials), function () {
                var jobNames = data.jobs.map(function (job) {
                    return ' * ' + job.name;
                }).join('\n');

                callback('Auth success. Available jobs: \n' + jobNames);
            });
        }
    );
}

function runJob(message, callback) {
    authenticate(message, function (credentials, err) {
        if (err) {
            callback(err);
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
    });
}


function authenticate(message, callback) {
    getUserStore().find(TELEGRAM, message.from.id, function (credentials) {
        if (!credentials) {
            callback(null, 'Please run /auth command first.');
            return;
        }

        callback(credentials);
    });
}