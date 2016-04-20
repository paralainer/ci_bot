var jenkinsSubscriptionService = require('../../jenkins/subscriptionService');
var getSubscriptionId = require('./utils/subscriptionUtils').getSubscriptionId;

module.exports = function (message, credentials) {
    var subscription = jenkinsSubscriptionService.getSubscription(credentials);
    subscription.removeListener(getSubscriptionId(message));
    message.answer('You are unsubscribed from all builds');
};