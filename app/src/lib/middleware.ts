import jwt from 'jsonwebtoken'
import config from '../config'

export default async (ctx, next) => {
  if (!ctx.header.authorization) {
    ctx.status = 401
    return
  }
  const [type, _jwt] = ctx.header.authorization.split(' ')
  if (type.length > 0 && _jwt.length > 0) {
    try {
      const user = await jwt.verify(_jwt, config.jwt.secret)
      ctx.state.auth = user
    } catch (err) {
      ctx.status = 401
      ctx.body = err.message
      return
    }
  } else {
    ctx.status = 401
    return
  }
  return next()
}