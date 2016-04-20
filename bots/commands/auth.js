var jenkinsClient = require('../../jenkins/jenkinsClient');
var getUserStore = require('../../users/UserStore');

module.exports = function(message){
    var parts = message.params;
    var url = parts[0];
    var username = parts[1];
    var token = parts[2];

    if (!url) {
        return;
    }

    var credentials = {
        url: url,
        username: username,
        token: token
    };

    jenkinsClient.checkCredentials(
        credentials,
        function (data, err) {
            if (err) {
                message.answer('Auth error');
                return;
            }

            getUserStore().save(message.bot.getName(), Object.assign({id: message.chatId}, credentials), function () {
                var jobNames = data.jobs.map(function (job) {
                    return ' * ' + job.name;
                }).join('\n');

                message.answer(`Auth success. Available jobs: \n ${jobNames}`);
            });
        }
    );
};