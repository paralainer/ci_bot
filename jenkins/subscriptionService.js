var jenkinsClient = require('../jenkins/jenkinsClient');

var subscriptions = {};

var pollingInterval = 5000;

var Subscription = function (credentials) {
    this.credentials = credentials;
    this.key = getKey(credentials);
    this.listeners = {};
    this.subscriptionStarted = false;
};

function startSubscription(subscription) {
    subscribe(subscription.credentials, function(newBuilds){
        Object.keys(subscription.listeners).forEach(function(key) {
            subscription.listeners[key](newBuilds);
        });
    });
}

Subscription.prototype.addListener = function (id, callback) {
    this.listeners[id] = callback;
    if (!this.subscriptionStarted) {
        this.subscriptionStarted = true;
        startSubscription(this);
    }
};

function removeSubscription(subscription) {
    delete subscriptions[subscription.key];
}

Subscription.prototype.removeListener = function (id) {
    delete this.listeners[id];
    if (Object.keys(this.listeners).length === 0) {
        removeSubscription(this);
        this.subscriptionStarted = false;
    }
};

function getKey(credentials) {
    return credentials.url + ':' + credentials.username + ':' + credentials.token;
}


module.exports.getSubscription = function (credentials) {
    var key = getKey(credentials);
    var subscription = subscriptions[key];
    if (!subscription) {
        subscription = new Subscription(credentials);
        subscriptions[key] = subscription
    }

    return subscription;
};

function subscribe(credentials, callback) {
    var maxTimestamp = null;

    function notifyNewBuilds() {
        getNewBuilds(credentials, maxTimestamp, function (newBuilds, timestamp) {
            maxTimestamp = timestamp;
            callback(newBuilds);
            setTimeout(notifyNewBuilds, pollingInterval);
        });
    }

    getNewBuilds(credentials, 0, function (builds, timestamp) {
        maxTimestamp = timestamp;
        setTimeout(notifyNewBuilds, pollingInterval);
    });
}


function getNewBuilds(credentials, timestamp, callback) {
    var maxTimestamp = timestamp;
    jenkinsClient.callApi(credentials, '/api/json?tree=jobs[name,builds[number,url,timestamp,building,result]]', function (data, err) {
        if (err) {
            console.log(err);
        } else {
            var newBuilds = [];
            data.jobs.forEach(function (job) {
                job.builds && job.builds.forEach(function (build) {
                    if (!build.building && build.timestamp > timestamp) {
                        newBuilds.push({
                            job: job.name,
                            number: build.number,
                            result: build.result,
                            url: build.url
                        });
                    }
                    if (!build.building && build.timestamp > maxTimestamp) {
                        maxTimestamp = build.timestamp;
                    }
                });
            });

            callback(newBuilds, maxTimestamp);
        }
    });
}