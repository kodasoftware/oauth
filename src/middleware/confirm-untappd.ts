import { Context } from 'koa'
import compose from 'koa-compose'
import jwt from 'jsonwebtoken'
import { requestValidationForSchema } from '@kodasoftware/koa-bundle/middleware'
import request from 'request-promise'
import { ServicesContextWithAuthorization, ServicesContext } from './context'
import { AuthJson } from '../database'
import config from '../config'

export default compose([
  async (ctx: Context & ServicesContext, next) => {
    const _jwt = ctx.cookies.get('HOPCO_AUTHUSER')
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
  requestValidationForSchema({
    type: 'object',
    properties: {
      code: { type: 'string', minLength: 10 },
    },
    required: ['code']
  }),
  async function confirmUntappdToken(ctx: ServicesContextWithAuthorization) {
    const auth = ctx.state.user
    const { code } = ctx.request.query
    try {
      const tokens = await request.get(
        'https://untappd.com/oauth/authorize/?client_id=' + config.untappd.clientId +
        '&client_secret=' + config.untappd.clientSecret +
        '&response_type=code&' +
        '&code=' + code +
        '&redirect_url=' + config.app.host + config.app.prefix +'/untappd/confirm',
        { json: true },
      )
        .then(({ response: { access_token } }) => ctx.services.auth.addUntappdTokenToAuth(auth, access_token))
        .then((res) => ctx.services.token.createTokenFromAuth(res.auth))
      ctx.redirect(ctx.request.headers.referer + 'account?token=' + tokens.accessToken)
    } catch(error) {
      ctx.status = 500
    }
  },
])
