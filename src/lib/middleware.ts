import jwt from 'jsonwebtoken'
import config from '../config'
import { Context } from 'koa'
import { ServicesContext } from '../middleware/context'
import { AuthJson } from '../database'

export default async (ctx: Context & ServicesContext, next) => {
  if (!ctx.header.authorization) {
    ctx.status = 401
    return
  }
  const [type, _jwt] = ctx.header.authorization.split(' ')
  if (type.length > 0 && _jwt.length > 0) {
    try {
      const user = await jwt.verify(_jwt, config.jwt.secret) as AuthJson & { sub: string, iat: number, exp: number }
      const authResponse = await ctx.services.auth.getAuthFromIdEmail(user.sub, user.email)
      if (authResponse.status !== 200) {
        ctx.status = authResponse.status
        if (authResponse.error) ctx.body = authResponse.error
        return
      }
      if (!authResponse.auth || authResponse.auth.deleted) {
        ctx.status = 401
        return
      }
      ctx.state.auth = user
      ctx.state.user = authResponse.auth
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