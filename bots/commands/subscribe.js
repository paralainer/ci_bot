var subscriptionManager = require('../../jenkins/subscriptions/subscriptionsManager');

module.exports = function (message, credentials) {
  subscriptionManager.subscribe(credentials, {bot: message.bot.getName(), chatId: message.chatId}, () => message.answer('you are subscribed'));
};
