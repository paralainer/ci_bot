var Client = new require('node-rest-client').Client;
var client = new Client({
    mimetypes: {
        json: ["application/json", "application/json; charset=utf-8"]
    }
});

var telegramKey = process.env.TELEGRAM_KEY;


function callMethod(methodName, params, callback) {
    client.post('https://api.telegram.org/bot' + telegramKey + '/' + methodName,
        {
            data: params || {},
            headers: {"Content-Type": "application/json"}
        },
        function (data, response) {
            callback(data);
        }
    );
}

module.exports.method = callMethod;