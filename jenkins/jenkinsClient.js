module.exports.checkCredentials = checkCredentials;
module.exports.callApi = callApi;
module.exports.runJob = runJob;

var Client = new require('node-rest-client').Client;
var client = new Client({
    mimetypes: {
        json: ["application/json", "application/json;charset=utf-8", "application/json; charset=utf-8"]
    }
});

function callApi(credentials, path, params, callback) {
    if (!callback) {
        callback = params;
        params = null;
    }

    client.post(credentials.url + path,
        {
            data: params || {},
            headers: Object.assign({"Content-Type": "application/json"}, buildAuthHeader(credentials))
        },
        function (data, response) {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                callback(data);
            } else {
                callback(null, 'Error calling jenkins api: ' + JSON.stringify(data));
            }
        })
}

function checkCredentials(credentials, callback) {
    try {
        callApi(credentials, '/api/json', function (data) {
            if (data.jobs) {
                callback(data);
            } else {
                callback(data, 'Auth error');
            }
        });
    } catch (e) {
        callback(null, 'Auth error');
    }
}

function runJob(credentials, jobName, callback) {
    client.post(credentials.url + '/job/' + jobName + '/build?token=TOKEN', {headers: buildAuthHeader(credentials)}, function (data, response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
            callback();
        } else {
            callback('Job not found');
        }
    });
}


function buildAuthHeader(credentials) {
    return {"Authorization": "Basic " + new Buffer([credentials.username, credentials.token].join(":")).toString("base64")}
}


