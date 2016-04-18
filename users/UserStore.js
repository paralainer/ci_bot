var UserStore = function (db) {
    this.db = db;
};

UserStore.prototype.save = function (prefix, credentials, callback) {
    var collection = this.db.collection(prefix + '_users');
    collection.findOneAndDelete({id: credentials.id}).then(function () {
        collection.insertOne(credentials).then(callback)
    });
};

UserStore.prototype.find = function (prefix, id, callback) {
    var collection = this.db.collection(prefix + '_users');
    collection.find({id: id}).limit(1).next(function (err, doc) {
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
    userStore = new UserStore(db);
};

module.exports.get = function () {
    return userStore;
};
