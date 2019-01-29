/**
 * Delete table in Amazon DynamoDB
 */

require('./bootstrap')
const config = require('config')
const logger = require('./common/logger')
const helper = require('./common/helper')

logger.info('Delete DynamoDB table.')

const deleteTable = async () => {
  await helper.deleteTable(config.AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE)
}

deleteTable().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})
