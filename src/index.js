
var baseHandler = require('aws-services-lib/lambda/base_handler.js')

exports.handler = (event, context) => {
  baseHandler.handler(event, context);
}

baseHandler.get = function(params, callback) {

  var AWS = require('aws-sdk');
  var aws_config = new (require('aws-services-lib/aws/awsconfig.js'))();

  var input = {};
  if (params.region) input['region'] = params.region;
  if (params.credentials) {
    input['creds'] = new AWS.Credentials({
      accessKeyId: params.credentials.AccessKeyId,
      secretAccessKey: params.credentials.SecretAccessKey,
      sessionToken: params.credentials.SessionToken
    });
  }
  console.log(input)

  function succeeded(input) { callback(null, {result: true}); }
  function failed(input) { callback(null, {result: false}); }
  function errored(err) { callback(err, null); }

  var flows = [
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:failed, error:errored},
    {func:aws_config.findRecordersStatus, success:aws_config.findChannels, failure:failed, error:errored},
    {func:aws_config.findChannels, success:aws_config.findChannelsStatus, failure:failed, error:errored},
    {func:aws_config.findChannelsStatus, success:succeeded, failure:failed, error:errored}
  ];
  aws_config.flows = flows;

  flows[0].func(input);
};

baseHandler.post = function(params, callback) {

  var AWS = require('aws-sdk');
  var aws_bucket = new (require('aws-services-lib/aws/s3bucket.js'))();
  var aws_topic = new (require('aws-services-lib/aws/topic.js'))();
  var aws_role = new (require('aws-services-lib/aws/role.js'))();
  var aws_config = new (require('aws-services-lib/aws/awsconfig.js'))();
  var aws_iam = new (require('aws-services-lib/aws/role.js'))();

  var assumeRolePolicyName = process.env.ASSUME_ROLE_POLICY_NAME;
  var inlinePolicyName = process.env.INLINE_POLICY_NAME;
  var rolePolicyArn = process.env.ROLE_POLICY_ARN;
  var deliveryChannelName  = process.env.DELIVERY_CHANNEL_NAME;
  var configRecorderName = process.env.CONFIG_RECORDER_NAME;
  var topicName = process.env.TOPIC_NAME;
  var roleName = process.env.ROLE_NAME + "-" + params.region;

  var fs = require("fs");
  var assumeRolePolicyDocument = fs.readFileSync(__dirname + '/json/' + assumeRolePolicyName + '.json', {encoding:'utf8'});
  console.log(assumeRolePolicyDocument);
  var inlinePolicyDocument = fs.readFileSync(__dirname + '/json/' + inlinePolicyName + '.json', {encoding:'utf8'});
  console.log(inlinePolicyDocument);

  var input = {
    deliveryChannelName : deliveryChannelName,
    configRecorderName : configRecorderName,
    bucketName : null,
    topicName : topicName,
    assumeRolePolicyName: assumeRolePolicyName,
    assumeRolePolicyDocument: assumeRolePolicyDocument,
    roleName : roleName,
    roleNamePostfix: (new Date()).getTime(),
    inlinePolicyName : inlinePolicyName,
    inlinePolicyDocument: inlinePolicyDocument,
    policyArn: rolePolicyArn,
    roleArn : null,
    topicArn : null,
    inlinePolicyDoc : null
  };
  input['region'] = params.region;
  if (params.credentials) {
    input['creds'] = new AWS.Credentials({
      accessKeyId: params.credentials.AccessKeyId,
      secretAccessKey: params.credentials.SecretAccessKey,
      sessionToken: params.credentials.SessionToken
    });
  }

  function findTargetAccountId(input) {
    var iamInput = {
      region: input.region,
      creds: input.creds
    }
    aws_iam.findAccountId(iamInput, function(err, data) {
      if(err) {
        console.log('failed to find target account id');
        errored({error: 'failed to find target account id'});
      }
      else {
        //input.targetAccount = data;
        input.bucketName = data + process.env.BUCKET_NAME_POSTFIX + "." + input.region;
        console.log(input);
        aws_role.findRoleByPrefix(input);
      }
    });
  }

  function succeeded(input) { callback(null, {result: true}); }
  function failed(input) { callback(null, {result: false}); }
  function errored(err) { callback(err, null); }

  var flows = [
    {func:findTargetAccountId, success:aws_role.findRoleByPrefix, failure:failed, error:errored},
    {func:aws_role.findRoleByPrefix, success:aws_role.findInlinePolicy, failure:aws_role.createRole, error:errored},
    {func:aws_role.createRole, success:aws_role.createInlinePolicy, failure:failed, error:errored},
    {func:aws_role.findInlinePolicy, success:aws_role.deleteInlinePolicy, failure:aws_role.createInlinePolicy, error:errored},
    {func:aws_role.deleteInlinePolicy, success:aws_role.createInlinePolicy, failure:failed, error:errored},
    {func:aws_role.createInlinePolicy, success:aws_role.attachPolicy, failure:failed, error:errored},
    {func:aws_role.attachPolicy, success:aws_bucket.findBucket, failure:failed, error:errored},
    {func:aws_bucket.findBucket, success:aws_topic.findTopic, failure:aws_bucket.createBucket, error:errored},
    {func:aws_bucket.createBucket, success:aws_topic.findTopic, failure:failed, error:errored},
    {func:aws_topic.findTopic, success:aws_config.findRecorders, failure:aws_topic.createTopic, error:errored},
    {func:aws_topic.createTopic, success:aws_config.findRecorders, failure:failed, error:errored},
    {func:aws_config.findRecorders, success:aws_config.setRoleInRecorder, failure:aws_config.setRoleInRecorder, error:errored},
    {func:aws_config.setRoleInRecorder, success:aws_config.findChannels, failure:failed, error:errored},
    {func:aws_config.findChannels, success:aws_config.findRecordersStatus, failure:aws_config.setChannel, error:errored},
    {func:aws_config.setChannel, success:aws_config.findRecordersStatus, failure:failed, error:errored},
    {func:aws_config.findRecordersStatus, success:succeeded, failure:aws_config.startRecorder, error:errored},
    {func:aws_config.startRecorder, success:succeeded, failure:failed, error:errored}
  ];
  aws_iam.flows = flows;
  aws_bucket.flows = flows;
  aws_topic.flows = flows;
  aws_role.flows = flows;
  aws_config.flows = flows;

  flows[0].func(input);
};

baseHandler.delete = function(params, callback) {

  var AWS = require('aws-sdk');
  var aws_config = new (require('aws-services-lib/aws/awsconfig.js'))();

  var input = {
  };
  if (params.region) input['region'] = params.region;
  if (params.credentials) {
    input['creds'] = new AWS.Credentials({
      accessKeyId: params.credentials.AccessKeyId,
      secretAccessKey: params.credentials.SecretAccessKey,
      sessionToken: params.credentials.SessionToken
    });
  }
  console.log(input)

  function succeeded(input) { callback(null, {result: true}); }
  function failed(input) { callback(null, {result: false}); }
  function errored(err) { callback(err, null); }

  var flows = [
    {func:aws_config.findRecorders, success:aws_config.findRecordersStatus, failure:succeeded, error:errored},
    {func:aws_config.findRecordersStatus, success:aws_config.stopRecorder, failure:succeeded, error:errored},
    {func:aws_config.stopRecorder, success:succeeded, failure:failed, error:errored}
  ];
  aws_config.flows = flows;

  flows[0].func(input);
};
