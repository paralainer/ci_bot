var userStore = {};

var UpdatesFetcher = require('./updatesFetcher');
var telegramClient = require('./telegramClient');
var jenkinsClient = require('../jenkins/jenkinsClient');

module.exports.start = function () {
    console.log('Starting telegram bot server...');

    new UpdatesFetcher(onUpdate).start();

    console.log('Telegram bot server started.');
};

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