/**
 * The configuration file.
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'tc-member-account-processor-group',
  // below two params are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  AMAZON_AWS_REGION: process.env.AMAZON_AWS_REGION || 'us-east-1',
  AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE: process.env.AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE || 'MemberProfile',

  // copilot role name used to check whether user is copilot
  COPILOT_ROLE_NAME: process.env.COPILOT_ROLE_NAME || 'copilot',

  // Kafka topics related to Creation and Update of User
  USER_CREATE_TOPIC: process.env.USER_CREATE_TOPIC || 'event.user.created',
  USER_UPDATE_TOPIC: process.env.USER_UPDATE_TOPIC || 'event.user.updated',

  // Kafka output topics to be consumed by member-processor-es to save member profile data in Elasticsearch
  USER_CREATE_OUTPUT_TOPIC: process.env.USER_CREATE_OUTPUT_TOPIC || 'member.action.profile.create',
  USER_UPDATE_OUTPUT_TOPIC: process.env.USER_UPDATE_OUTPUT_TOPIC || 'member.action.profile.update',
  OUTPUT_MESSAGE_ORIGINATOR: process.env.OUTPUT_MESSAGE_ORIGINATOR || 'tc-member-account-processor'
}
