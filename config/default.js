/**
 * The configuration file.
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  // below two params are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,

  // Kafka topics related to Creation and Update of User
  USER_CREATE_TOPIC: process.env.USER_CREATE_TOPIC || 'event.user.created',
  USER_UPDATE_TOPIC: process.env.USER_UPDATE_TOPIC || 'event.user.updated',

  MEMBER_API_URL: process.env.MEMBER_API_URL || 'https://topcoder-mock-member-service.herokuapp.com/v3/users',

  AUTH0_URL: process.env.AUTH0_URL, // Auth0 credentials to access Member API
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET
}
