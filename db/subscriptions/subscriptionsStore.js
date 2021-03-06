const collectionName = 'subscriptions';

var SubscriptionsStore = function (db) {
    this.db = db;
    this.collection = db.collection(collectionName);

    this.findOne = function (credentials, resultCallback) {
        this.collection.find(this.getCredentialsFilter(credentials)).limit(1).next((err, subscription) => {
            resultCallback(subscription);
        });
    };

    this.findAll = function (resultCallback) {
        this.collection.find({}).toArray().then(resultCallback);
    };

    this.subscribe = function (credentials, subscriber, onSubscribed) {
        var credentialsFilter = this.getCredentialsFilter(credentials);
        this.collection.findOneAndDelete(credentialsFilter)
            .then(function (result) {
                var existingSubscription = result.value;
                var newSubscription = null;
                if (!existingSubscription) {
                    newSubscription = {
                        credentials: credentialsFilter.credentials,
                        subscribers: []
                    }
                } else {
                    newSubscription = existingSubscription;
                }

                var existingSubscriber = newSubscription.subscribers.find((s) => s.bot == subscriber.bot && s.chatId == subscriber.chatId);
                if (!existingSubscriber) {
                    newSubscription.subscribers.push(subscriber);
                } else {
                    this.mergeSubscriber(subscriber, existingSubscriber)
                }

                this.collection.insertOne(newSubscription).then(onSubscribed);
            }.bind(this));
    };

    this.mergeSubscriber = function (from, to) {
        //
    };

    this.unsubscribe = function (credentials, subscriber) {
        var credentialsFilter = this.getCredentialsFilter(credentials);
        this.collection.findOneAndDelete(credentialsFilter)
            .then(function (result) {
                var subscription = result.value;
                if (!subscription) {
                    return;
                }

                subscription.subscribers = subscription.subscribers.filter((s) => !(s.bot == subscriber.bot && s.chatId == subscriber.chatId));
                this.collection.insertOne(subscription).then(function(){});
            }.bind(this));
    };

    this.getCredentialsFilter = function (credentials) {
        return {
            credentials: {
                url: credentials.url,
                username: credentials.username,
                token: credentials.token
            }
        };
    };
};


var subscriptionsStore = null;

module.exports.init = function (db) {
    subscriptionsStore = new SubscriptionsStore(db);
};

module.exports.get = function () {
    return subscriptionsStore;
};