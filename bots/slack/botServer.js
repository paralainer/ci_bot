'use strict';

var util = require('util');
var Bot = require('slackbots');

// create a bot
var settings = {
  token: 'xoxb-35823258532-qdeOdQyegkdVAVVcgFuIuUxk',
  name: 'Jenkins Bot'
};

var bot = new Bot(settings);

module.exports.start = function() {
  bot.on('start', onStart);
  bot.on('message', onMessage);
};

function onStart() {
  console.log('Slack bot has been started');
}

function onMessage(message) {
  if (message.subtype !== 'bot_message') {
    if (isChannelConversation(message)) {
      var channel = getChannelById(message.channel);
      bot.postTo(channel.name, util.format('your message length is %s symbols', message.text.length));
      return;
    }
    if (isChatMessage(message)) {
      var user = getUserById(message.user);
      bot.postTo(user.name, util.format('your message length is %s symbols', message.text.length));
    }
  }
}

function isChatMessage(message) {
  return message.type === 'message' && Boolean(message.text);
}

function isChannelConversation(message) {
  return typeof message.channel === 'string' &&
    message.channel[0] === 'C';
}

function getChannelById(channelId) {
  return bot.channels.filter(function (item) {
    return item.id === channelId;
  })[0];
}

function getUserById(userId) {
  return bot.users.filter(function (item) {
    return item.id === userId;
  })[0];
}