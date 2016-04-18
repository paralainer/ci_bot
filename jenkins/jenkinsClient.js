var Client = new require('node-rest-client').Client;

function buildClient(credentials) {
    return new Client({
        user: credentials.username,
        password: credentials.token,
        mimetypes: {
            json: ["application/json", "application/json;charset=utf-8"]
        }
    });
}

module.exports.checkCredentials = function (credentials, callback) {
    var httpClient = buildClient(credentials);
    httpClient.get(credentials.url + '/api/json', function (data) {
        if (data.jobs) {
            callback(data);
        } else {
            callback(data, 'Auth error');
        }
    });
};

module.exports.callApi = function (credentials, path, params, callback) {
    if (!callback) {
        callback = params;
        params = null;
    }

    buildClient(credentials).post(credentials.url + path,
        {
            data: params || {},
            headers: {"Content-Type": "application/x-www-form-urlencoded"}
        },
        function (data, response) {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                callback(data);
            } else {
                callback(null, 'Error calling jenkins api: ' + JSON.stringify(data));
            }
        })
};


module.exports.runJob = function (credentials, jobName, callback) {
    var httpClient = new Client({
        user: credentials.username,
        password: credentials.token
    });
    httpClient.post(credentials.url + '/job/' + jobName + '/build?token=TOKEN', {}, function (data, response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
            callback();
        } else {
            callback('Job not found');
        }
    });
};


