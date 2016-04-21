var BotServer = require('./botServer');
var TelegramBot = require('./telegram/telegramBot');

var botServer = new BotServer([
    new TelegramBot(process.env.TELEGRAM_KEY)
]);

module.exports = botServer;