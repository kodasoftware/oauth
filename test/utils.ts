import Knex from 'knex'
import * as knexfile from '../knexfile'
import { PubSub } from '@google-cloud/pubsub'
import config from '../src/config'
import Koa from 'koa'
import { attachAuthContext } from '../src/app'
import logger from '../src/logger'

export function getKnex() {
  return Knex(knexfile)
}

export const clearDataset = (tables: string[]) => Promise.all(tables.map((table) => getKnex().table(table).delete()))

export async function createPubSubTopic() {
  try {
    const pubsub = new PubSub(config.pubsub.opts)
    await pubsub.createTopic(config.pubsub.topic)
  } catch (err) {
    if (err.code === 6) return
    console.error(err) // tslint:disable-line
    throw err
  }
}

export async function createPubSubSubscription(name) {
  try {
    const pubsub = new PubSub(config.pubsub.opts)
    const subscription = await pubsub.createSubscription(config.pubsub.topic, name)
    return subscription
  } catch (err) {
    if (err.code === 6) return
    console.error(err) // tslint:disable-line
    throw err
  }
}

export async function createPubSubPushSubscription(name, port) {
  try {
    const endpoint = 'http://localhost:' + port + '/messages'
    const pubsub = new PubSub(config.pubsub.opts)
    const subscription = await pubsub.createSubscription(config.pubsub.topic, name, { pushEndpoint: endpoint })
    return subscription
  } catch (err) {
    if (err.code === 6) return
    console.error(err) // tslint:disable-line
    throw err
  }
}

export async function listenForMessage(subscriptionName, callback = null, timeout = 60) {
  const pubsub = new PubSub(config.pubsub.opts)
  const subscription = pubsub.subscription(subscriptionName)
  const messageHandler = (message) => {
    logger.debug(`Received message ${message.id}:`)
    logger.debug(`\tData: ${message.data}`)
    logger.debug(`\tAttributes: ${message.attributes}`)
    if (callback) callback(message)
    // "Ack" (acknowledge receipt of) the message
    message.ack()
  }
  subscription.on('message', messageHandler)

  await setTimeout(() => {
    subscription.removeListener('message', messageHandler)
  }, timeout * 1000)
}

export function createPubSubSubscriber() {
  return attachAuthContext(new Koa())
}
