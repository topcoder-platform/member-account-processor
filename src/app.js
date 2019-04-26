/**
 * The application entry point
 */

require('./bootstrap')
require('dotenv').config()
const config = require('config')
const logger = require('./common/logger')
const Kafka = require('no-kafka')
const ProcessorService = require('./services/ProcessorService')
const healthcheck = require('topcoder-healthcheck-dropin')

// create consumer
const options = { connectionString: config.KAFKA_URL, handlerConcurrency: 1, groupId: config.KAFKA_GROUP_ID }
if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
  options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
}
const consumer = new Kafka.GroupConsumer(options)

// create producer
const producerOptions = { connectionString: config.KAFKA_URL, handlerConcurrency: 1 }
if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
  producerOptions.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY }
}
const producer = new Kafka.Producer(producerOptions)

/*
 * Data handler linked with Kafka consumer
 * Whenever a new message is received by Kafka consumer,
 * this function will be invoked
 */
const dataHandler = async (messageSet, topic, partition) => {
  await Promise.each(messageSet, (m) => {
    const message = m.message.value.toString('utf8')
    logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
      m.offset}; Message: ${message}.`)
    let messageJSON
    try {
      messageJSON = JSON.parse(message)
    } catch (e) {
      logger.error('Invalid message JSON.')
      logger.logFullError(e)
      // commit the message and ignore it
      consumer.commitOffset({ topic, partition, offset: m.offset })
      return
    }

    if (messageJSON.topic !== topic) {
      logger.error(`The message topic ${messageJSON.topic} doesn't match the Kafka topic ${topic}.`)
      // commit the message and ignore it
      consumer.commitOffset({ topic, partition, offset: m.offset })
      return
    }

    return (async () => {
      switch (topic) {
        case config.USER_CREATE_TOPIC:
          if (!messageJSON.payload.hasOwnProperty('notificationType')) {
            await ProcessorService.processCreateUser(messageJSON, producer)
          } else {
            logger.info('Ignore message.')
          }
          break
        case config.USER_UPDATE_TOPIC:
          if (!messageJSON.payload.hasOwnProperty('notificationType')) {
            await ProcessorService.processUpdateUser(messageJSON, producer)
          } else {
            logger.info('Ignore message.')
          }
          break
        default:
          throw new Error(`Invalid topic: ${topic}`)
      }
    })()
      // commit offset
      .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
      .catch((err) => logger.logFullError(err))
  })
}

// check if there is kafka connection alive
const check = () => {
  if (!consumer.client.initialBrokers && !consumer.client.initialBrokers.length) {
    return false
  }
  let connected = true
  consumer.client.initialBrokers.forEach(conn => {
    logger.debug(`url ${conn.server()} - connected=${conn.connected}`)
    connected = conn.connected & connected
  })
  return connected
}

// init producer first, so that the handler is ready to produce message before consumption
// Start kafka producer
logger.info('Starting kafka producer')
producer
  .init()
  .then(() => {
    logger.info('Kafka producer initialized successfully')
    // consume configured topics and setup healthcheck endpoint
    // Start kafka consumer
    logger.info('Starting kafka consumer')
    return consumer
      .init([{
        subscriptions: [config.USER_CREATE_TOPIC, config.USER_UPDATE_TOPIC],
        handler: dataHandler
      }])
  })
  .then(() => {
    healthcheck.init([check])
    logger.info('Kafka consumer initialized successfully')
  })
  .catch(logger.logFullError)
