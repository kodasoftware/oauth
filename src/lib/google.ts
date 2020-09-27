import { OAuth2Client } from 'google-auth-library'
import { PubSub } from '@google-cloud/pubsub'
import config from '../config'
import logger from '../logger'

const client = new OAuth2Client(config.google)
const pubsub = new PubSub(config.pubsub.opts)

export async function validateToken(token: string): Promise<any> {
  try {
    const usr = await client.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    })
    return usr.getPayload()
  } catch (err) {
    logger.error(err)
  }
  return false
}

export async function publishMessageToPubSub(topic: string, data: any, attributes?: any): Promise<any> {
  try {
    const response = await pubsub.topic(topic).publishJSON({ data }, attributes)
    return response
  } catch (err) {
    logger.error(err)
    return false
  }
}