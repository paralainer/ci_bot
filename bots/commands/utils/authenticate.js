var store = require('../../../db/users/userStore').get;

module.exports = function (command, message) {
    store().find(message.bot.getName(), message.chatId, function (credentials) {
        if (!credentials) {
            message.answer('Please run /auth command first.');
            return;
        }

        command(message, credentials);
    });
};