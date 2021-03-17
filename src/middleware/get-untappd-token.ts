import { Context } from 'koa'
import compose from 'koa-compose'
import jwt from 'jsonwebtoken'
import { ServicesContextWithAuthorization, ServicesContext } from './context'
import { AuthJson } from '../database'
import config from '../config'

export default compose([
  async (ctx: Context & ServicesContext, next) => {
    const { token: _jwt } = ctx.request.query
    if (!_jwt) {
      ctx.status = 401
      return
    }
    if (_jwt.length > 0) {
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
  },
  async function getUntappdToken(ctx: ServicesContextWithAuthorization) {
    const auth = ctx.state.user
    if (auth.untappd_token) {
      ctx.redirect(ctx.request.headers.referer + 'account?token=' + auth.untappd_token)
      return
    }
    ctx.redirect('https://untappd.com/oauth/authenticate/?client_id=' + config.untappd.clientId +
      '&response_type=code' +
      '&redirect_url=' + config.app.host + config.app.prefix + '/untappd')
  },
])
