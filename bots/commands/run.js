var jenkinsClient = require('../../jenkins/jenkinsClient');

module.exports = function (message, credentials) {
    var jobName = message.params;

    if (!jobName) {
        if (message.handlePartialCommand &&
            message.handlePartialCommand(credentials) === false
        ) {
            message.answer('Usage: /run _job name_', {parse_mode: 'Markdown'});
        }
        return;
    }

    jenkinsClient.runJob(credentials, jobName, function (err) {
        if (!err) {
            message.answer('Job \'' + jobName + '\' started');
        } else {
            message.answer('Job \'' + jobName + '\' not found');
        }
    });
};