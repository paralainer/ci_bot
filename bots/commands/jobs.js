var jenkinsClient = require('../../jenkins/jenkinsClient');

module.exports = function (message, credentials) {
    var view = message.params;
    var pathPrefix = '';
    if (view && view.length > 0) {
        pathPrefix = '/view/' + view;
    }

    jenkinsClient.callApi(credentials, pathPrefix + '/api/json', {tree: 'jobs[name]'}, function (data, err) {
        if (err) {
            console.log(err);
            message.answer('Command failed.');
        } else {
            var jobsNames = data.jobs.map((el) => ' * ' + el.name);
            var viewText = '';
            if (view) {
                viewText = ' for view \'' + view + '\'';
            }
            message.answer('Jobs list' + viewText + ':\n' + jobsNames.join('\n'));
        }
    });
};