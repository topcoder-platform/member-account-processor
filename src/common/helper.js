/**
 * Contains generic helper methods
 */

const _ = require('lodash')
const config = require('config')
const AWS = require('aws-sdk')
const axios = require('axios')
const m2mAuth = require('tc-core-library-js').auth.m2m
const logger = require('./logger')

let m2m

// Database instance mapping
const dbs = {}
// Database Document client mapping
const dbClients = {}

AWS.config.update({
  region: config.AMAZON_AWS_REGION
})

const harmonyClient = new AWS.Lambda({apiVersion: "latest"})
/**
 * Send event to Harmony.
 * @param {String} eventType The event type
 * @param {String} payloadType The payload type
 * @param {Object} payload The event payload
 * @returns {Promise}
 */
async function sendHarmonyEvent(eventType, payloadType, payload) {
  const event = {
    publisher: config.OUTPUT_MESSAGE_ORIGINATOR,
    timestamp: new Date().getTime(),
    eventType,
    payloadType,
    payload
  }
  if (payloadType === 'Member') {
    // For Member payload, set id as userId
    event.payload = {
      id: `${payload.userId}`,
      ...payload
    }
  }
  return new Promise((resolve, reject) => {
    harmonyClient.invoke({
      FunctionName: config.HARMONY_LAMBDA_FUNCTION,
      InvocationType: "Event",
      Payload: JSON.stringify(event)
    }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/*
 * Function to get M2M token
 * @returns {Promise}
 */
async function getM2MToken () {
  if (!m2m) {
    m2m = m2mAuth(_.pick(config.auth0, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'AUTH0_PROXY_SERVER_URL']))
  }
  return m2m.getMachineToken(config.auth0.AUTH0_CLIENT_ID, config.auth0.AUTH0_CLIENT_SECRET)
}

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

/**
 * Get trait onboarding_checklist from member Api
 * @param     {string} handle the member handle
 * @returns   {promise} the result
 */
async function getOnboardingChecklist (handle, token) {
  const url = `${config.MEMBERS_API_URL}/${handle}/traits?traitIds=onboarding_checklist`
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const responseObject = res.data
    if (responseObject.length > 0) {
      return responseObject[0].traits.data
    }
  } catch (err) { }

  return []
}

/**
 * update trait onboarding_checklist to indicate to consumers if onboarding wizard
 * can be skipped or if onboarding wizard should take the user to the original url
 * the user signed up from
 *
 * @param     {string} handle the handle of the member
 * @param     {string} type skip to skip the onboarding wizard; forward to use retUrl
 * @param     {string} message the skip/carry forward reason
 * @returns   {promise}
 */
async function addOverrideOnboardingChecklist (handle, type, message) {
  const token = await getM2MToken()

  const existingOnboardingCheckilst = await getOnboardingChecklist(handle, token)
  const shouldCreate = existingOnboardingCheckilst.length === 0

  const onboardingWizardIndex = _.findIndex(existingOnboardingCheckilst, data => data['onboarding_wizard'] != null)
  const onboardingWizardData = {
    onboarding_wizard: {
      override: type,
      date: new Date().getTime(),
      metadata: {
        overrideReason: message
      },
      status: 'pending_at_user'
    }
  }

  let traitData = existingOnboardingCheckilst

  if (onboardingWizardIndex === -1) {
    traitData.push(onboardingWizardData)
  } else {
    // copy over existing status
    if (traitData[onboardingWizardIndex].onboarding_wizard.status != null) {
      onboardingWizardData.onboarding_wizard.status = traitData[onboardingWizardIndex].onboarding_wizard.status
    }

    traitData[onboardingWizardIndex] = onboardingWizardData
  }

  const payload = [{
    categoryName: 'Onboarding Checklist',
    traitId: 'onboarding_checklist',
    traits: {
      data: traitData
    }
  }]

  const url = `${config.MEMBERS_API_URL}/${handle}/traits`
  const requestConfig = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }

  try {
    if (shouldCreate) {
      logger.info(`Creating onboarding_checklist with onboarding_wizard for user with handle ${handle}.`)
      await axios.post(url, payload, requestConfig)
    } else {
      logger.info(`Updating onboarding_checklist to add onboarding_wizard for user with handle ${handle}.`)
      await axios.put(url, payload, requestConfig)
    }
  } catch (err) {
    logger.error(`Failed to set onboarding_wizard in onboarding_checklist for user with handle ${handle}. Failed with error ${JSON.stringify(err)}`)
  }
}

module.exports = {
  getDb,
  getDbClient,
  createTable,
  deleteTable,
  updateRecord,
  addOverrideOnboardingChecklist,
  sendHarmonyEvent
}
