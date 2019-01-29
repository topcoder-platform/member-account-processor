/**
 * Contains generic helper methods
 */

const config = require('config')
const AWS = require('aws-sdk')

// Database instance mapping
const dbs = {}
// Database Document client mapping
const dbClients = {}

AWS.config.update({
  region: config.AMAZON_AWS_REGION
})

/**
 * Get DynamoDB Connection Instance
 * @return {Object} DynamoDB Connection Instance
 */
function getDb () {
  // cache it for better performance
  if (!dbs['conn']) {
    dbs['conn'] = new AWS.DynamoDB()
  }
  return dbs['conn']
}

/**
 * Get DynamoDB Document Client
 * @return {Object} DynamoDB Document Client Instance
 */
function getDbClient () {
  // cache it for better performance
  if (!dbClients['client']) {
    dbClients['client'] = new AWS.DynamoDB.DocumentClient()
  }
  return dbClients['client']
}

/**
 * Creates table in DynamoDB
 * @param     {object} model Table structure in JSON format
 * @return    {promise} the result
 */
async function createTable (model) {
  const db = getDb()
  return new Promise((resolve, reject) => {
    db.createTable(model, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Deletes table in DynamoDB
 * @param     {String} tableName Name of the table to be deleted
 * @return    {promise} the result
 */
async function deleteTable (tableName) {
  const db = getDb()
  const item = {
    TableName: tableName
  }
  return new Promise((resolve, reject) => {
    db.deleteTable(item, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Insert record into DynamoDB
 * @param     {object} record Data to be inserted
 * @return    {promise} the result
 */
async function insertRecord (record) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.put(record, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Update record in DynamoDB
 * @param     {object} record Data to be updated
 * @return    {promise} the result
 */
async function updateRecord (record) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.update(record, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

module.exports = {
  getDb,
  getDbClient,
  createTable,
  deleteTable,
  insertRecord,
  updateRecord
}
