import FB from 'fb'
import logger from '../logger'
import config from '../config'

FB.options({ version: config.facebook.apiVersion })
FB.setAccessToken(config.facebook.token)

export async function validateToken(user_access_token: string): Promise<any> {
  
  try {
    const { data } = await FB.api('debug_token', { input_token: user_access_token })
    if (data) {
      const { type, is_valid, scopes, user_id, error } = data
      if (error) {
        throw error
      }
      if (is_valid && type === 'USER' && scopes.includes('email')) {
        const usr = await FB.api(user_id, { access_token: user_access_token, fields: 'email' })
        return usr
      }
    }
  } catch (err) {
    logger.error(err, 'Facebook validate token error')
  }
  return false
}

export async function extendAccessToken(access_token: string): Promise<any> {
  try {
    return await FB.api('access_token', { fb_exchange_token: access_token, grant_type: 'fb_exchange_token' })
  } catch (err) {
    logger.error(err)
  }
  return
}

export { FB }
