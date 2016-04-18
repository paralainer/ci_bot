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


function start(message, callback) {
    fs.readFile('./messages/start.html', 'utf8', function (err,data) {
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
    getUserStore().find(TELEGRAM, message.from.id, function (credentials) {
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
    });

}