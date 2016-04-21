var usersStoreInit = require('./users/userStore').init;
var subscriptionsStoreInit = require('./subscriptions/subscriptionsStore').init;

var registry = {
    UsersStore: usersStoreInit,
    SubscriptionsStore: subscriptionsStoreInit
};

module.exports.initStores = function(db){
    Object.keys(registry).forEach((storeName) => {
       try {
           registry[storeName](db);
           console.log(`Store '${storeName}' initialized successfully`);
       } catch (e){
           console.error(`Error while initializing store '${storeName}':` + e);
       }
    });
};