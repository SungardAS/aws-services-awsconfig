
const Credentials = {
  "AccessKeyId": "",
  "SecretAccessKey": "",
  "SessionToken": ""
};
const querystr = {
  "region": ""
};

var event = {
  "path": "/awsconfig",
  "httpMethod": "GET",
  "headers": {
    "Credentials": new Buffer(JSON.stringify(Credentials)).toString('base64')
  },
  "queryStringParameters": querystr,
  "body": {
  }
}

var i = require('../src/index.js');
var context = {succeed: res => console.log(res)};
i.handler(event, context, function(err, data) {
  if (err)  console.log("failed : " + err);
  else console.log("completed: " + JSON.stringify(data));
});
