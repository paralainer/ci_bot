var UpdatesFetcher = require('./updatesFetcher');
var telegramClient = require('./telegramClient');

var TelegramBot = function (token) {
    this.token = token;
    this.updatesFetcher = null;
    this.onMessage = null;


    //public
    this.getName = () => 'telegram';

    //public
    this.subscribe = (onMessage) => {
        this.onMessage = onMessage;
    };

    //public
    this.start = (onStarted) => {
        if (!this.token) {
            onStarted(`Error: token for bot ${this.getName()} is not specified`);
        }
        this.updatesFetcher = new UpdatesFetcher(this.token, this.onUpdate, this.onError);
        this.updatesFetcher.start();
        onStarted();
    };

    //public
    this.sendMessage = (chatId, text, options) => {
        telegramClient.method(this.token, 'sendMessage',
            Object.assign({chat_id: chatId}, {text: text}, this.toTelegramOptions(options)),
            function (data) {
                if (data.ok) {
                    console.log('Sent message: ' + text + ' to chat: ' + chatId);
                } else {
                    console.error(data);
                }
            }
        );
    };

    //private
    this.onUpdate = (data, tellLastUpdateId) => {
        var updateId = 0;
        data.result.forEach(function (el) {
            if (updateId < el.update_id) {
                updateId = el.update_id;
            }

            if (this.onMessage) {
                this.onMessage(this.fromTelegramMessage(el.message));
            } else {
                console.log(`onMessage is not set for ${this.getName()} bot, maybe you forgot to call subscribe method.`)
            }

        }, this);

        tellLastUpdateId(updateId);
    };


    //private
    this.onError = (data) => {
        console.log('Error: ' + data);
    };

    //private
    this.fromTelegramMessage = (telegramMessage) => {
        var command = this.parseCommand(telegramMessage);
        return {
            text: telegramMessage.text,
            chatId: telegramMessage.chat.id,
            userId: telegramMessage.from.id,
            command: command.name,
            params: command.params,
            bot: this,
            answer: (text, options) => {
                this.sendMessage(
                    telegramMessage.chat.id,
                    text,
                    options
                )
            }
        }
    };

    //private
    this.toTelegramOptions = (options) => {
        return options;
    };



    //private
    this.parseCommand = (message) => {
        var command = null;
        var params = null;
        message.entities && message.entities.forEach(function (entity) {
            if (entity.type === 'bot_command') {
                //ignore all commands that are not at the beginning of text
                if (entity.offset > 0) {
                    return false;
                }

                command = message.text.substr(1, entity.length - 1);

                //fix for commands with bot name like /run@ci_fellow_bot
                command = command.split('@')[0];
                params = message.text.substr(entity.length);
                if (params) {
                    params = params.trim();
                }
                return false;
            }
        });

        return {name: command, params: params}
    };

};

module.exports = TelegramBot;