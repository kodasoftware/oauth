import request from 'request-promise'
import config from '../config'
import logger from '../logger'

export async function validateToken(token: string): Promise<any> {
  try {
    const usr = await request.get(config.untappd.host + '/user/info?access_token=' + token + '&compact=true')
      .then(JSON.parse)
    return usr
  } catch (err) {
    logger.error(err)
  }
  return false
}
