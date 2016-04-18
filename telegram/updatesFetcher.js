var client = require('./telegramClient');

var UpdatesFetcher = function (onUpdate, onError) {
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.updateId = 0;
};

UpdatesFetcher.prototype.start = function () {
    this.fetchUpdate();
};

UpdatesFetcher.prototype.fetchUpdate = function () {
    var me = this;
    client.method('getUpdates', {offset: this.updateId + 1, timeout: 30},
        function (data) {
            console.log('Update arrived');
            if (data.ok) {
                me.onUpdate(data, function (lastUpdateId) {
                    me.updateId = lastUpdateId;
                    me.fetchUpdate();
                });
            } else {
                me.onError && me.onError(data);
                me.fetchUpdate();
            }

        }
    );
};

module.exports = UpdatesFetcher;