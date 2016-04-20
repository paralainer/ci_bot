var jenkinsClient = require('../../jenkins/jenkinsClient');

module.exports = function(message, credentials){
    jenkinsClient.callApi(credentials, '/api/json', {tree: 'views[name]'}, function (data, err) {
        if (err) {
            console.log(err);
        } else {
            var viewsNames = data.views.map((el) => ' * ' + el.name);
            message.answer(`Views list:\n${viewsNames.join('\n')}`);
        }
    });
};