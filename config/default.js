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
  USER_CREATE_TOPIC: process.env.USER_CREATE_TOPIC || 'identity.notification.create',
  USER_UPDATE_TOPIC: process.env.USER_UPDATE_TOPIC || 'identity.notification.update',
  USER_LOGIN_TOPIC: process.env.USER_LOGIN_TOPIC || 'member.action.login',

  // Kafka output topics to be consumed by member-processor-es to save member profile data in Elasticsearch
  USER_CREATE_OUTPUT_TOPIC: process.env.USER_CREATE_OUTPUT_TOPIC || 'member.action.profile.create',
  USER_UPDATE_OUTPUT_TOPIC: process.env.USER_UPDATE_OUTPUT_TOPIC || 'member.action.profile.update',
  OUTPUT_MESSAGE_ORIGINATOR: process.env.OUTPUT_MESSAGE_ORIGINATOR || 'tc-member-account-processor',

  // User states
  USER_STATES: {
    ACTIVE: process.env.USER_ACTIVE_STATE || 'ACTIVE',
    UNVERIFIED: process.env.USER_UNVERIFIED_STATE || 'UNVERIFIED'
  },

  auth0: {
    AUTH0_URL: process.env.AUTH0_URL,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
    TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME
  },

  MEMBERS_API_URL: process.env.MEMBERS_API_URL || 'https://api.topcoder-dev.com/v5/members',

  // List of registration sources that can skip the onboarding wizard
  SKIP_ONBOARDING_REG_SOURCES: process.env.SKIP_ONBOARDING_REG_SOURCES || ['taasApp', 'gigs', 'selfService'],
  // List of registration sources that should carry over original registration url (retUrl); users registering
  // through these sources will be taken to retUrl at the end of the onboarding process
  FORWARD_TO_RET_URL_REG_SOURCES: process.env.FORWARD_TO_RET_URL_REG_SOURCES || ['challenges'],

  HARMONY_LAMBDA_FUNCTION: process.env.HARMONY_LAMBDA_FUNCTION || 'arn:aws:lambda:us-east-1:811668436784:function:harmony-api-dev-processMessage'
}
