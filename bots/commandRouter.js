var auth = require('./commands/auth');
var authenticate = require('./commands/utils/authenticate');
var run = require('./commands/run');
var start = require('./commands/start');
var jobs = require('./commands/jobs');
var views = require('./commands/views');
var subscribe = require('./commands/subscribe');
var unsubscribe = require('./commands/unsubscribe');

module.exports.runCommand = function (message) {
    console.log(`Got command '${message.command}' from ${message.bot.getName()} bot, chat id = ${message.chatId}`);
    var command = message.command;
    switch (command) {
        case 'auth':
            auth(message);
            break;

        case 'run':
            authenticate(run, message);
            break;

        case 'start':
            start(message);
            break;

        case 'jobs':
            authenticate(jobs, message);
            break;

        case 'views':
            authenticate(views, message);
            break;

        case 'subscribe':
            authenticate(subscribe, message);
            break;

        case 'unsubscribe':
            authenticate(unsubscribe, message);
            break;

        default:
            message.answer(`Unknown command: ${command}`);
    }
};