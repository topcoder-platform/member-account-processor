/**
 * TC member account processor Service
 */

const _ = require('lodash')
const config = require('config')
const joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Convert date to epoch
 * @param {Date|String} date the date
 */
const toEpoch = date => (new Date(date)).getTime()

/**
 * Convert user payload from identity service to member profile data of ap-member-microservice,
 * i.e. the samle data format given in forum, the converted data will be saved to DynamoDB and Elasticsearch.
 * @param {Object} user the user payload to convert
 * @returns {Object} the converted member profile
 */
function convertPayload (user) {
  const memberProfile = {
    userId: Number(user.id),
    firstName: user.firstName ? user.firstName : 'N/A',
    lastName: user.lastName ? user.lastName : 'N/A',
    handle: user.handle,
    handleLower: user.handle.toLowerCase(),
    email: user.email,
    status: user.active ? config.USER_STATES.ACTIVE : config.USER_STATES.UNVERIFIED,
    homeCountryCode: user.country ? user.country.isoAlpha3Code : null,
    competitionCountryCode: user.country ? user.country.isoAlpha3Code : null,
    country: user.country ? user.country.name : null,
    copilot: user.roles ? !!_.find(user.roles, (role) => role.roleName === config.COPILOT_ROLE_NAME) : false,
    createdAt: user.createdAt ? toEpoch(user.createdAt) : null,
    createdBy: user.createdBy,
    updatedAt: user.modifiedAt ? toEpoch(user.modifiedAt) : null,
    updatedBy: user.modifiedBy
  }
  return _.omitBy(memberProfile, _.isNil)
}

/**
 * Create record to be updated/inserted into dynamoDB
 * @param {Object} memberProfile the member profile object
 */
function formatRecord (memberProfile) {
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
  if (memberProfile.competitionCountryCode) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, competitionCountryCode = :competitionCountryCode`
    record['ExpressionAttributeValues'][':competitionCountryCode'] = memberProfile.competitionCountryCode
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
  return record
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
  const record = formatRecord(memberProfile)

  // create or update member profile in DynamoDB
  await helper.updateRecord(record)
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

  const regSource = message.payload.regSource
  logger.info(`Registration source for member with handle ${message.payload.handle} is ${regSource}.`)
  if (_.find(config.SKIP_ONBOARDING_REG_SOURCES, source => source === regSource) != null) {
    logger.info(`Registration source is part of sources that can skip onboarding.`)
    helper.addOverrideOnboardingChecklist(message.payload.handle, 'skip', `Registration source[${regSource}] doesn't require onboarding.`)
  } else if (_.find(config.FORWARD_TO_RET_URL_REG_SOURCES, source => source === regSource) != null) {
    logger.info(`Registration source is part of sources that require taking user to original registration url (retUrl).`)
    helper.addOverrideOnboardingChecklist(message.payload.handle, 'useRetUrl', `Registration source[${regSource}] requires taking user to original registration url at the end of onboarding flow.`)
  }  
  else {
    logger.info(`Registration source requires member to be presented with the onboarding wizard.`)
  }
}

processCreateUser.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      id: joi.string().trim().required(),
      handle: joi.string().trim().required(),
      email: joi.string().trim().email().required(),
      firstName: joi.string().trim().allow('').allow(null),
      lastName: joi.string().trim().allow('').allow(null),
      profiles: joi.array().allow(null),
      status: joi.string().trim(),
      active: joi.boolean().required(),
      country: joi.object().allow(null),
      roles: joi.array().allow(null),
      modifiedBy: joi.string().trim().allow(null),
      modifiedAt: joi.date().allow(null),
      createdBy: joi.string().trim().allow(null),
      createdAt: joi.date().allow(null),
      regSource: joi.string().trim().allow('').allow(null)
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

  const record = formatRecord(memberProfile)
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

/**
 * Process the User login event
 * @param {Object} message the Kafka message in JSON format
 * @param {Object} producer the Kafka producer
 */
async function processUserLogin (message, producer) {
  const member = message.payload
  const record = {
    TableName: config.AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE,
    Key: {
      userId: member.userId
    },
    UpdateExpression: `set lastLoginDate = :lastLoginDate`,
    ExpressionAttributeValues: {
      ':lastLoginDate': member.lastLoginDate,
    },
  }
  if (member.loginCount) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, loginCount = :loginCount`
    record['ExpressionAttributeValues'][':loginCount'] = member.loginCount
  }
  await helper.updateRecord(record)
  logger.info('DynamoDB record is updated successfully.')

  // send output message to Kafka
  const outputMessage = {
    topic: config.USER_UPDATE_OUTPUT_TOPIC,
    originator: config.OUTPUT_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload: member
  }
  await producer.send({ topic: outputMessage.topic, message: { value: JSON.stringify(outputMessage) } })
  logger.info(`Member profile update message is successfully sent to Kafka topic ${outputMessage.topic}`)
}

processUserLogin.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      userId: joi.number().required(),
      loginCount: joi.number(),
      lastLoginDate: joi.date().raw().required(),
    }).unknown(true).required()
  }).required(),
  producer: joi.object().required()
}

module.exports = {
  processCreateUser,
  processUpdateUser,
  processUserLogin
}

logger.buildService(module.exports)
