
/*
export BUCKET_NAME_POSTFIX=.awsconfig
export TOPIC_NAME=awsconfig-topic
export ASSUME_ROLE_POLICY_NAME=awsconfig_assume_role_policy
export ROLE_NAME=awsconfig-setup-role
export INLINE_POLICY_NAME=awsconfig_setup_policy
export ROLE_POLICY_ARN=arn:aws:iam::aws:policy/service-role/AWSConfigRole
export DELIVERY_CHANNEL_NAME=default
export CONFIG_RECORDER_NAME=default
*/

const Credentials = {
  "AccessKeyId": "",
  "SecretAccessKey": "",
  "SessionToken": ""
};
const body = {
  "region": ""
};

var event = {
  "path": "/awsconfig",
  "httpMethod": "POST",
  "headers": {
    "Credentials": new Buffer(JSON.stringify(Credentials)).toString('base64')
  },
  "queryStringParameters": null,
  "body": JSON.stringify(body)
}


var i = require('../src/index.js');
var context = {succeed: res => console.log(res)};
i.handler(event, context, function(err, data) {
  if (err)  console.log("failed : " + err);
  else console.log("completed: " + JSON.stringify(data));
});
