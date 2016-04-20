var collectionName = 'subscriptions';

var SubscriptionsStore = function (db) {
    this.db = db;
};

SubscriptionsStore.prototype.save = function (subscription, callback) {
    var collection = this.db.collection(collectionName);
    collection.findOneAndDelete({chatId: subscription.chatId}).then(function () {
        collection.insertOne(subscription).then(callback)
    });
};

SubscriptionsStore.prototype.find = function (chatId, callback) {
    var collection = this.db.collection(collectionName);
    collection.find({chatId: chatId}).limit(1).next(function (err, doc) {
            if (err) {
                console.log(err);
                callback(null);
            } else {
                callback(doc)
            }
        }
    );
};



var userStore = null;

module.exports.init = function (db) {
    userStore = new SubscriptionsStore(db);
};

module.exports.get = function () {
    return userStore;
};