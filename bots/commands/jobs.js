var jenkinsClient = require('../../jenkins/jenkinsClient');

module.exports = function (message, credentials) {
    jenkinsClient.getJobsList(credentials, message.params, function (jobs, err) {
        var viewText = '';
        if (view) {
            viewText = ' for view \'' + view + '\'';
        }
        if (err) {
            console.log(err);
            message.answer('Command failed.');
        } else {
            message.answer('Jobs list' + viewText + ':\n' + jobs.map((job) => ' * ' + job).join('\n'));
        }
    });
};