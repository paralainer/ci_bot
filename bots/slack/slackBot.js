'use strict';

var util = require('util');
var BotLib = require('slackbots');

var SlackBot = function (settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'Jenkins Slack Bot';
    BotLib.call(this, this.settings);
};

util.inherits(SlackBot, BotLib);

SlackBot.prototype.getName = function () {
    return this.settings.name;
};

SlackBot.prototype.subscribe = function () {
    this.on('message',this._onMessage);
};

SlackBot.prototype.start = function (onStart) {
    if (!this.settings.token) {
        onStart(util.format('Error: token for bot %s is not specified', this.settings.name));
    }
    this.on('start', this._onStart);
};

// Not implemented yet.
SlackBot.prototype.sendMessage = function (chatId, text, options) {
console.log('send msg');
};

SlackBot.prototype._onStart = function () {
    this.postTo('general', 'Hi everybody');
    console.log('Slack bot has been started in _ONSTART');
}

SlackBot.prototype._onMessage = function(message){
    if (message.subtype !== 'bot_message') {
        if (this._isChannelConversation(message)) {
            var channel = this._getChannelById(this, message.channel);
            this.postTo(channel.name, util.format('Your message length is %s symbols', message.text.length));
            return;
        }
        if (this._isChatMessage(message)) {
            var user = this._getUserById(this, message.user);
            this.postTo(user.name, util.format('Your message length is %s symbols', message.text.length));
        }
    }
};

SlackBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

SlackBot.prototype._isChannelConversation = function(message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

SlackBot.prototype._getChannelById = function (self, channelId) {
    return self.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

SlackBot.prototype._getUserById = function(self, userId) {
    return self.users.filter(function (item) {
        return item.id === userId;
    })[0];
};

module.exports = SlackBot;