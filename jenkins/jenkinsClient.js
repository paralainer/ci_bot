var Client = new require('node-rest-client').Client;


module.exports.checkCredentials = function (credentials, callback) {
    var httpClient = new Client({
        user: credentials.username,
        password: credentials.token,
        mimetypes: {
            json: ["application/json", "application/json;charset=utf-8"]
        }
    });
    httpClient.get(credentials.url + '/api/json', function (data) {
        if (data.jobs) {
            callback(data);
        } else {
            callback(data, 'Auth error');
        }
    });
};


module.exports.runJob = function (credentials, jobName, callback) {
    var httpClient = new Client({
        user: credentials.username,
        password: credentials.token
    });
    httpClient.post(credentials.url + '/job/' + jobName + '/build?token=TOKEN', {}, function (data, response) {
        if (response.statusCode > 200 && response.statusCode < 300) {
            callback();
        } else {
            callback('Job not found');
        }
    });
};


