/**
 * Create table in Amazon DynamoDB
 */

require('./bootstrap')
const config = require('config')
const logger = require('./common/logger')
const helper = require('./common/helper')

logger.info('Create DynamoDB table.')

const createTable = async () => {
  await helper.createTable({
    TableName: config.AMAZON_AWS_DYNAMODB_MEMBER_PROFILE_TABLE,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'N' } // N -> Number
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    }
  })
}

createTable().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})
