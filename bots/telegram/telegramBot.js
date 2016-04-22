var UpdatesFetcher = require('./updatesFetcher');
var telegramClient = require('./telegramClient');
var jenkinsClient = require('../../jenkins/jenkinsClient');
var runCommand = require('../commandRouter').runCommand;

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
        this.updatesFetcher = new UpdatesFetcher(this.token, this.onUpdate.bind(this), this.onError.bind(this));
        this.updatesFetcher.start();
        onStarted();
    };

    //public
    this.sendMessage = (chatId, text, options) => {
        this._sendMessage(Object.assign({chat_id: chatId}, {text: text}, this.toTelegramOptions(options)));
    };

    this._sendMessage = (config) => {
        // console.log(config);
        telegramClient.method(this.token, 'sendMessage',
            config,
            function (data) {
                if (data.ok) {
                    console.log('Sent message: ' + config.text + ' to chat: ' + config.chat_id);
                } else {
                    console.error(data);
                }
            }
        );
    };

    this._answerCallbackQuery = (config) => {
        telegramClient.method(this.token, 'answerCallbackQuery',
            config,
            function (data) {
                console.log('Sent answer to callback query');
            }
        );
    };

    //private
    this.onUpdate = function(data, tellLastUpdateId) {
        var updateId = 0;
        data.result.forEach(function (el) {
            if (updateId < el.update_id) {
                updateId = el.update_id;
            }

            if (el.message) {
                this.onMessage(this.fromTelegramMessage(el.message));
            } else if (el.callback_query) {
                var message = el.callback_query.message;
                if (message) {
                    try {
                        var command = JSON.parse(el.callback_query.data);
                        //console.log(el.callback_query);
                        var callbackMessage = {
                            command: command.command,
                            params: command.params,
                            text: `/${command.command} ${command.params}`,
                            chatId: message.chat.id,
                            userId: message.from.id,
                            bot: this,
                            answer: function (text, options) {
                                this._answerCallbackQuery({
                                    callback_query_id: el.callback_query.id,
                                    text: text
                                });
                                this.sendMessage(message.chat.id, text);
                            }.bind(this)
                        };

                        runCommand(callbackMessage);
                    } catch (e) {
                        console.log(e);
                    }
                }
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
        var message = {
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
        };

        message.handlePartialCommand = function (credentials) {
            this.handlePartialCommand(message, credentials)
        }.bind(this);
        return message;
    };

    //private
    this.toTelegramOptions = (options) => {
        return options;
    };

    this.handlePartialCommand = function (message, credentials) {
        switch (message.command) {
            case 'run':
                return this.showJobsKeyboard(message, credentials);
        }

        return false;
    };

    this.showKeyboard = function (chatId, jobs) {
        var buttons = jobs.map((job) => {
            return [{
                text: job
                //callback_data: JSON.stringify({command: 'run', params: job})
            }]
        });
        this._sendMessage(
            {
                chat_id: chatId,
                text: 'Please select job: ',
                reply_markup: {
                    hide_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    };

    this.showJobsKeyboard = function (message, credentials) {
        jenkinsClient.getJobsList(credentials, message.params, function (jobs, err) {
            if (err) {
                return;
            }

            this.showInlineKeyboard(message.chatId, jobs);

        }.bind(this));
    };

    this.showInlineKeyboard = function (chatId, jobs) {
        var buttons = jobs.map((job) => {
            return [{
                text: job,
                callback_data: JSON.stringify({command: 'run', params: job})
            }]
        });

        this._sendMessage(
            {
                chat_id: chatId,
                text: 'Please select job: ',
                reply_markup: {
                    inline_keyboard: buttons

                }
            }
        );
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