var client = require('./telegramClient');

var UpdatesFetcher = function (onUpdate, onError) {
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.updateId = 0;
};

UpdatesFetcher.prototype.start = function () {
    setTimeout(this.fetchUpdate.bind(this), 1000);
};

UpdatesFetcher.prototype.fetchUpdate = function () {
    var me = this;
    client.method('getUpdates', {offset: this.updateId + 1},
        function (data) {
            if (data.ok) {
                me.onUpdate(data, function (lastUpdateId) {
                    me.updateId = lastUpdateId;
                    setTimeout(me.fetchUpdate.bind(me));
                });
            } else {
                me.onError && me.onError(data);
            }

        }
    );
};

module.exports = UpdatesFetcher;