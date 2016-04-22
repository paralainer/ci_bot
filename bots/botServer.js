var runCommand = require('./commandRouter').runCommand;
var fs = require('fs');

/**
 * Each bot should implement following rules:
 *  methods:
 *      getName() - this method should return bot unique name
 *      subscribe(function onMessage(message)) - this method should accept callback function that accepts message object
 *                                               callback function is called each time when new message has arrived
 *      start(function onStart()) - start method should start the bot (connect to server etc.), after that it should call callback method
 *      sendMessage(chatId, text, options)
 *  message format:
 *      Bot should return message in the following format:
 *      {
            text: <message text>,
            chatId: <unique id of a chat>,
            userId: <unique user id>,
            command: <if message is a command - command name should be here, for example for command '/run build; it should be 'run' >,
            params: <command params if exist, for '/run build' it should be 'build'>,
            bot: <Bot object>,
            answer: (text, options) => {...} - callback function that will be called to answer the message, should send the message to user chat
        }
 */
var BotServer = function (bots) {
    this.bots = bots;

    //public
    this.start = function () {
        this.bots.forEach((bot) => {
            var name = bot.getName();

            bot.subscribe(this.onMessage.bind(this));

            bot.start((err) => {
                if (err) {
                    console.log(`Error starting bot ${name}: ` + err);
                    return;
                }
                console.log(`Bot '${name}' started`);
            });
        });
    };

    //public
    this.sendMessage = function (botName, chatId, text, options) {
        var bot = this.bots.find((bot) => bot.getName() == botName);
        if (bot) {
            this.handleMessage(
                text,
                options,
                (text, options) => bot.sendMessage(chatId, text, options)
            );
        } else {
            console.log(`Can't send message to bot ${botName}, bot not found`);
        }

    };

    //private
    this.onMessage = function (message) {
        if (message.command) {
            this.answerProxy(message);
            runCommand(message);
        }
    };

    //private
    this.answerProxy = function (message) {
        var answerFunc = message.answer;
        message.answer = function (messageText, options) {
            this.handleMessage(messageText, options, answerFunc);
        }.bind(this);
    };

    //private
    this.handleMessage = function (messageText, options, callback) {
        if (typeof messageText === 'string') {
            callback(messageText, options);
            return;
        }

        if (messageText.template) {
            this.renderMessage(messageText, options, callback);
        }
    };


    //private
    this.renderMessage = function (message, options, callback) {
        fs.readFile(message.template, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }
            if (message.config) {
                Object.keys(message.config).forEach(function (paramKey) {
                    data = data.split('$' + paramKey).join(message.config[paramKey]);
                });
            }
            callback(data, Object.assign(options || {}, {'parse_mode': 'Markdown'}));
        });
    }
};

module.exports = BotServer;

