/*
 * Handle events for Job.
 */

const { Op } = require('sequelize')
const models = require('../models')
const logger = require('../common/logger')
const helper = require('../common/helper')
const JobCandidateService = require('../services/JobCandidateService')
const ResourceBookingService = require('../services/ResourceBookingService')

/**
 * Cancel all related resource bookings and reject all related candidates when a job is cancelled.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function cancelJob (payload) {
  if (payload.status !== 'cancelled') {
    logger.info({
      component: 'JobEventHandler',
      context: 'cancelJob',
      message: `not interested job - status: ${payload.status}`
    })
    return
  }
  const candidates = await models.JobCandidate.findAll({
    where: {
      jobId: payload.id,
      status: {
        [Op.not]: 'rejected'
      },
      deletedAt: null
    }
  })
  const resourceBookings = await models.ResourceBooking.findAll({
    where: {
      projectId: payload.projectId,
      status: {
        [Op.not]: 'cancelled'
      },
      deletedAt: null
    }
  })
  await Promise.all([
    ...candidates.map(candidate => JobCandidateService.partiallyUpdateJobCandidate(
      helper.authUserAsM2M(),
      candidate.id,
      { status: 'rejected' }
    ).then(result => {
      logger.info({
        component: 'JobEventHandler',
        context: 'cancelJob',
        message: `id: ${result.id} candidate got rejected.`
      })
    })),
    ...resourceBookings.map(resource => ResourceBookingService.partiallyUpdateResourceBooking(
      helper.authUserAsM2M(),
      resource.id,
      { status: 'cancelled' }
    ).then(result => {
      logger.info({
        component: 'JobEventHandler',
        context: 'cancelJob',
        message: `id: ${result.id} resource booking got cancelled.`
      })
    }))
  ])
}

/**
 * Process job update event.
 *
 * @param {Object} payload the event payload
 * @returns {undefined}
 */
async function processUpdate (payload) {
  await cancelJob(payload)
}

module.exports = {
  processUpdate
}
