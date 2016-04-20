var jenkinsClient = require('../../jenkins/jenkinsClient');

module.exports = function (message, credentials) {
    var jobName = message.params;

    if (!jobName) {
        message.answer('Usage: /run [build_name]');
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