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
    this.on('message', _onMessage);
    console.log('Slack bot has been subscribed');
};

SlackBot.prototype.start = function (onStart) {
    if (!this.settings.token) {
        onStart(util.format(`Error: token for bot %s is not specified`, this.settings.name));
    }
    this.on('start', _onStart);
    console.log('Slack bot has been started');
};

function _onStart() {

    console.log('Slack bot has been started');
}

function _onMessage() {
    if (message.subtype !== 'bot_message') {
        if (_isChannelConversation(message)) {
            var channel = _getChannelById(message.channel);
            bot.postTo(channel.name, util.format('your message length is %s symbols', message.text.length));
            return;
        }
        if (_isChatMessage(message)) {
            var user = _getUserById(message.user);
            bot.postTo(user.name, util.format('your message length is %s symbols', message.text.length));
        }
    }
}

function _isChatMessage(message) {
    return message.type === 'message' && Boolean(message.text);
}

function _isChannelConversation(message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
}

function _getChannelById(channelId) {
    return bot.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
}

function _getUserById(userId) {
    return bot.users.filter(function (item) {
        return item.id === userId;
    })[0];
}

module.exports = SlackBot;