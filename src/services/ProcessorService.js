/**
 * TC member account processor Service
 */

const _ = require('lodash')
const config = require('config')
const joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Convert user payload from identity service to member profile data of ap-member-microservice,
 * i.e. the samle data format given in forum, the converted data will be saved to DynamoDB and Elasticsearch.
 * @param {Object} user the user payload to convert
 * @returns {Object} the converted member profile
 */
function convertPayload (user) {
  const memberProfile = {
    userId: user.profiles ? user.profiles[0].userId : null,
    firstName: user.firstName,
    lastName: user.lastName,
    handle: user.handle,
    handleLower: user.handle.toLowerCase(),
    email: user.email,
    status: user.status,
    homeCountryCode: user.country ? user.country.code : null,
    country: user.country ? user.country.name : null,
    copilot: user.roles ? !!_.find(user.roles, (role) => role.roleName === config.COPILOT_ROLE_NAME) : false,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    createdBy: user.createdBy,
    updatedAt: user.modifiedAt ? user.modifiedAt.toISOString() : null,
    updatedBy: user.modifiedBy
  }
  return memberProfile
}

/**
 * Process the User creation event
 * @param {Object} message the Kafka message in JSON format
 * @param {Object} producer the Kafka producer
 */
async function processCreateUser (message, producer) {
  if (!message.payload.createdAt) {
    message.payload.createdAt = new Date()
  }
  const memberProfile = convertPayload(message.payload)

  // create member profile in DynamoDB
  await helper.insertRecord({
    TableName: config.AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE,
    Item: memberProfile
  })
  logger.info('DynamoDB record is created successfully.')

  // send output message to Kafka
  const outputMessage = {
    topic: config.USER_CREATE_OUTPUT_TOPIC,
    originator: config.OUTPUT_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload: memberProfile
  }
  await producer.send({ topic: outputMessage.topic, message: { value: JSON.stringify(outputMessage) } })
  logger.info(`Member profile creation message is successfully sent to Kafka topic ${outputMessage.topic}`)
}

processCreateUser.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      handle: joi.string().trim().required(),
      email: joi.string().trim().email().required(),
      firstName: joi.string().trim().required(),
      lastName: joi.string().trim().required(),
      profiles: joi.array(),
      status: joi.string().trim(),
      country: joi.object(),
      roles: joi.array(),
      modifiedBy: joi.string().trim(),
      modifiedAt: joi.date(),
      createdBy: joi.string().trim(),
      createdAt: joi.date()
    }).unknown(true).required()
  }).required(),
  producer: joi.object().required()
}

/**
 * Process the User update event
 * @param {Object} message the Kafka message in JSON format
 * @param {Object} producer the Kafka producer
 */
async function processUpdateUser (message, producer) {
  if (!message.payload.modifiedAt) {
    message.payload.modifiedAt = new Date()
  }
  const memberProfile = convertPayload(message.payload)

  // update member profile in DynamoDB
  const record = {
    TableName: config.AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE,
    Key: {
      userId: memberProfile.userId
    },
    UpdateExpression: `set firstName = :firstName, lastName = :lastName,
                           handle = :handle, handleLower = :handleLower,
                           email = :email, copilot = :copilot`,
    ExpressionAttributeValues: {
      ':firstName': memberProfile.firstName,
      ':lastName': memberProfile.lastName,
      ':handle': memberProfile.handle,
      ':handleLower': memberProfile.handleLower,
      ':email': memberProfile.email,
      ':copilot': memberProfile.copilot
    },
    ExpressionAttributeNames: {}
  }
  if (memberProfile.status) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, #status = :s`
    record['ExpressionAttributeValues'][':s'] = memberProfile.status
    record['ExpressionAttributeNames']['#status'] = 'status'
  }
  if (memberProfile.homeCountryCode) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, homeCountryCode = :homeCountryCode`
    record['ExpressionAttributeValues'][':homeCountryCode'] = memberProfile.homeCountryCode
  }
  if (memberProfile.country) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, country = :country`
    record['ExpressionAttributeValues'][':country'] = memberProfile.country
  }
  if (memberProfile.createdAt) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, createdAt = :createdAt`
    record['ExpressionAttributeValues'][':createdAt'] = memberProfile.createdAt
  }
  if (memberProfile.createdBy) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, createdBy = :createdBy`
    record['ExpressionAttributeValues'][':createdBy'] = memberProfile.createdBy
  }
  if (memberProfile.updatedAt) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, updatedAt = :updatedAt`
    record['ExpressionAttributeValues'][':updatedAt'] = memberProfile.updatedAt
  }
  if (memberProfile.updatedBy) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, updatedBy = :updatedBy`
    record['ExpressionAttributeValues'][':updatedBy'] = memberProfile.updatedBy
  }
  await helper.updateRecord(record)
  logger.info('DynamoDB record is updated successfully.')

  // send output message to Kafka
  const outputMessage = {
    topic: config.USER_UPDATE_OUTPUT_TOPIC,
    originator: config.OUTPUT_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload: memberProfile
  }
  await producer.send({ topic: outputMessage.topic, message: { value: JSON.stringify(outputMessage) } })
  logger.info(`Member profile update message is successfully sent to Kafka topic ${outputMessage.topic}`)
}

processUpdateUser.schema = processCreateUser.schema

module.exports = {
  processCreateUser,
  processUpdateUser
}

logger.buildService(module.exports)
