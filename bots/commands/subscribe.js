var emoji = require('node-emoji').emoji;
var jenkinsSubscriptionService = require('../../jenkins/subscriptionService');
var getSubscriptionId = require('./utils/subscriptionUtils').getSubscriptionId;

module.exports = function (message, credentials) {
    var subscription = jenkinsSubscriptionService.getSubscription(credentials);

    listenSubscription(
        subscription,
        getSubscriptionId(message),
        message.answer,
        {
            SUCCESS: emoji.sunny,
            FAILED: emoji.rain_cloud
        }
    );
    
    message.answer('I will notify you about all new builds');
};


function listenSubscription(subscription, subscriptionId, sendMessage, emojis) {
    subscription.addListener(subscriptionId, function (newBuilds) {
        newBuilds.forEach(function (build) {
            sendMessage(
                {
                    template: './messages/build_finished.md',
                    config: Object.assign({
                        emoji: emojis[build.result]
                    }, build)
                },
                {
                    disable_web_page_preview: true
                }
            );
        });
    });

}