var BotServer = require('./botServer');
var SlackBot = require('./slack/slackBot');
var TelegramBot = require('./telegram/telegramBot');

var botServer = new BotServer([
    new TelegramBot(process.env.TELEGRAM_KEY),
    new SlackBot({token: process.env.SLACK_KEY})
]);

module.exports = botServer;