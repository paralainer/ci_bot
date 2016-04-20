var getUserStore = require('../../../users/UserStore').get;

module.exports = function (command, message) {
    getUserStore().find(message.bot.getName(), message.chatId, function (credentials) {
        if (!credentials) {
            message.answer('Please run /auth command first.');
            return;
        }

        command(message, credentials);
    });
};