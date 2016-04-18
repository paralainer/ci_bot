var Client = new require('node-rest-client').Client;
var client = new Client({
    mimetypes: {
        json: ["application/json", "application/json;charset=utf-8"]
    }
});

function buildAuthHeader(credentials) {
    return {"Authorization": "Basic " + new Buffer([credentials.username, credentials.token].join(":")).toString("base64")}
}


module.exports.checkCredentials = function (credentials, callback) {
    callApi(credentials, '/api/json', function (data) {
        if (data.jobs) {
            callback(data);
        } else {
            callback(data, 'Auth error');
        }
    });
};

module.exports.callApi = function callApi(credentials, path, params, callback) {
    if (!callback) {
        callback = params;
        params = null;
    }

    client.post(credentials.url + path,
        {
            data: params || {},
            headers: Object.assign({"Content-Type": "application/x-www-form-urlencoded"}, buildAuthHeader(credentials))
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
    httpClient.post(credentials.url + '/job/' + jobName + '/build?token=TOKEN', {headers: buildAuthHeader(credentials)}, function (data, response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
            callback();
        } else {
            callback('Job not found');
        }
    });
};


