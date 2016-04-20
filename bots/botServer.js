var CommandRouter = require('./commandRouter');
var fs = require('fs');

/**
 * Each bot should implement following rules:
 *  methods:
 *      getName() - this method should return bot unique name
 *      subscribe(function onMessage(message)) - this method should accept callback function that accepts message object
 *                                               callback function is called each time when new message has arrived
 *      start(function onStart()) - start method should start the bot (connect to server etc.), after that it should call callback method
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
    this.commandRouter = new CommandRouter();

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

    //private
    this.onMessage = function (message) {
        if (message.command) {
            this.answerProxy(message);
            this.commandRouter.runCommand(message);
        }
    };

    //private
    this.answerProxy = function (message) {
        var answer = message.answer;
        message.answer = function (answerObject, options) {
            this.handleAnswer(answerObject, answer, options);
        }.bind(this);
    };

    //private
    this.handleAnswer = function (answerObject, answerCallback, options) {
        if (typeof answerObject === 'string') {
            answerCallback(answerObject, options);
            return;
        }

        if (answerObject.template) {
            this.renderMessage(answerObject, answerCallback, options);
            return;
        }

        if (answerObject.text) {
            answerCallback(answerObject.text, answerObject);
        }
    };

    //private
    this.renderMessage = function (answerObject, answerCallback, options) {
        fs.readFile(answerObject.template, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }
            if (answerObject.config) {
                Object.keys(answerObject.config).forEach(function (paramKey) {
                    data = data.split('$' + paramKey).join(answerObject.config[paramKey]);
                });
            }
            answerCallback(data, Object.assign(options || {}, {'parse_mode': 'Markdown'}));
        });
    }
};

module.exports = BotServer;

