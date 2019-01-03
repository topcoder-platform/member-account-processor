/**
 * Processor Service
 */

const config = require('config')
const joi = require('joi')
const logger = require('../common/logger')
const helper = require('../common/helper')

/**
 * Process the User creation / update event
 * @param {Object} message the Kafka message in JSON format
 * @returns {Promise}
 */
const process = async (message) => {
  // Call the Member API with the payload from Identity API
  // TODO - Replace with proper API URL, Mock only supports POST
  const result = await helper.reqToMemberAPI('POST',
    config.MEMBER_API_URL, message.payload)
  logger.debug(`Response from Member API: %s`, JSON.stringify(result.body))
  return true
}

process.schema = {
  message: joi.object().keys({
    topic: joi.string().required(),
    originator: joi.string().required(),
    timestamp: joi.date().required(),
    'mime-type': joi.string().required(),
    payload: joi.object().keys({
      handle: joi.string().trim().required(),
      email: joi.string().trim().email(),
      firstName: joi.string().trim(),
      lastName: joi.string().trim(),
      status: joi.string().trim()
    }).unknown(true).required()
  }).required()
}

module.exports = {
  process
}

logger.buildService(module.exports)
