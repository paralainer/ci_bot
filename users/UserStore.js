var UserStore = function (db) {
    this.db = db;
};

UserStore.prototype.save = function(prefix, credentials, callback) {
    var collection = this.db.collection(prefix + '_users');
    collection.insertOne(credentials).then(callback);
};

UserStore.prototype.find = function(prefix, id, callback) {
    var collection = this.db.collection(prefix + '_users');
    collection.findOne({id: id}).then(callback);
};

var userStore = null;

module.exports.init = function (db) {
   userStore = new UserStore(db);
};

module.exports.get = function () {
  return userStore;
};
