var jenkinsClient = require('./../jenkinsClient');

const emoji = require('node-emoji').emoji;
const buildStatus = {
    SUCCESS: emoji.sunny,
    FAILURE: emoji.rain_cloud
};

const defaultPollingInterval = 5000;

var subscriptionStore = require('../../db/subscriptions/subscriptionsStore').get;


var ServerSubscription = function (credentials, botServer) {
    this.credentials = credentials;
    this.active = false;
    this.lastTimestamp = null;
    this.botServer = botServer;

    this.start = () => {
        if (this.active) {
            return;
        }
        this.active = true;
        this.lastTimestamp = Date.now();
        this.fetchNewBuilds();
    };

    this.stop = () => this.active = false;

    this.fetchNewBuilds = function () {
        if (!this.active) {
            return;
        }


        this.fetchSubscribers(function (subscribers) {
            if (subscribers.length == 0) {
                this.stop();
                return;
            }

            this.doQuery(this.lastTimestamp, function (newBuilds, maxTimestamp) {
                this.lastTimestamp = maxTimestamp;
                if (newBuilds.length > 0) {
                    this.notify(newBuilds, subscribers);
                }

                if (this.active) {
                    setTimeout(this.fetchNewBuilds.bind(this), defaultPollingInterval);
                }
            }.bind(this));

        }.bind(this));

    };

    this.fetchSubscribers = function (callback) {
        subscriptionStore().findOne(this.credentials, (subscription) => {
            if (!subscription) {
                callback([]);
                return;
            }
            callback(subscription.subscribers || []);
        });
    };

    this.doQuery = function (timestamp, callback) {
        var maxTimestamp = timestamp;
        jenkinsClient.callApi(credentials, '/api/json?tree=jobs[name,builds[number,url,timestamp,building,result]{,1}]', function (data, err) {
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
    };

    this.notify = function (newBuilds, subscribers) {
        subscribers.forEach(function (subscriber) {
            newBuilds.forEach(function (build) {
                if (this.buildMatches(build, subscriber)) {
                    this.notifySubscriber(build, subscriber);
                }
            }, this);
        }, this);
    };

    this.buildMatches = function (build, subscriber) {
        if (!subscriber.jobs && !subscriber.views) {
            return true;
        }
        return false;
    };


    this.notifySubscriber = function (build, subscriber) {
        this.botServer.sendMessage(
            subscriber.bot,
            subscriber.chatId,
            {
                template: './bots/messages/build_finished.md',
                config: Object.assign({
                    emoji: buildStatus[build.result]
                }, build)
            },
            {
                disable_web_page_preview: true
            }
        );
    };


};


var SubscriptionsManager = function () {
    this.subscriptions = {};
    this.botServer = null;

    //public
    this.start = function (botServer, onStarted) {
        this.botServer = botServer;
        subscriptionStore().findAll(function (subscriptions) {
            if (subscriptions) {
                this.startAllSubscriptions(subscriptions);
            }
            onStarted();
        }.bind(this));
    };

    //public
    this.subscribe = function (credentials, options, onSubscribed) {
        subscriptionStore().subscribe(credentials, options, function () {
            var key = this.getKey(credentials);
            var subscription = this.subscriptions[key];
            if (!subscription) {
                subscription = new ServerSubscription(credentials, this.botServer);
                this.subscriptions[key] = subscription;
            }

            subscription.start();
            onSubscribed();
        }.bind(this));
    };

    //public
    this.unsubscribe = function (credentials, options) {
        subscriptionStore().unsubscribe(credentials, options);
    };

    this.startAllSubscriptions = function (subscriptions) {
        subscriptions.forEach(function (subscription) {
            if (subscription.subscribers.length > 0) {
                var serverSubscription = new ServerSubscription(subscription.credentials, this.botServer);
                this.subscriptions[this.getKey(subscription.credentials)] = serverSubscription;
                serverSubscription.start();
            } else {
                subscriptionStore().delete(subscription.credentials);
            }
        }, this);
    };
    
    //private
    this.getKey = function (credentials) {
        return `${credentials.url}:${credentials.username}:${credentials.token}`;
    }
};


var subscriptionsManager = new SubscriptionsManager();

module.exports = subscriptionsManager;