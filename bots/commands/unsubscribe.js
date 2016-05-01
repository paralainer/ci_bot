var subscriptionsManager = require('../../jenkins/subscriptions/subscriptionsManager');

module.exports = function (message, credentials) {
    subscriptionsManager.unsubscribe(credentials, {
        bot: message.bot.getName(),
        chatId: message.chatId
    });
    message.answer('You are unsubscribed from all builds');
};