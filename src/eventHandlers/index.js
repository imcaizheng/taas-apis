/*
 * The entry of event handlers.
 */

const config = require('config')
const eventDispatcher = require('../common/eventDispatcher')
const JobEventHandler = require('./JobEventHandler')
const ResourceBookingEventHandler = require('./ResourceBookingEventHandler')
const logger = require('../common/logger')

const TopicOperationMapping = {
  [config.TAAS_JOB_UPDATE_TOPIC]: JobEventHandler.processUpdate,
  [config.TAAS_RESOURCE_BOOKING_UPDATE_TOPIC]: ResourceBookingEventHandler.processUpdate
}

/**
 * Handle event.
 *
 * @param {String} topic the topic name
 * @param {Object} payload the message payload
 * @returns {undefined}
 */
async function handleEvent (topic, payload) {
  if (!TopicOperationMapping[topic]) {
    logger.info({ component: 'eventHanders', context: 'handleEvent', message: `not interested event - topic: ${topic}` })
    return
  }
  logger.debug({ component: 'eventHanders', context: 'handleEvent', message: `handling event - topic: ${topic} - payload: ${JSON.stringify(payload)}` })
  try {
    await TopicOperationMapping[topic](payload)
  } catch (err) {
    logger.error({ component: 'eventHanders', context: 'handleEvent', message: 'failed to handle event' })
    // throw error so that it can be handled by the app
    throw err
  }
  logger.info({ component: 'eventHanders', context: 'handleEvent', message: 'event successfully handled' })
}

/**
 * Attach the handlers to the event dispatcher.
 *
 * @returns {undefined}
 */
function init () {
  eventDispatcher.register({
    handleEvent
  })
}

module.exports = {
  init
}
