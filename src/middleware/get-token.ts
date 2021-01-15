import compose from 'koa-compose'
import { AuthContext, StripeContext } from './context'
import { middleware } from '@kodasoftware/koa-bundle'
import config from '../config'

export default compose<AuthContext & StripeContext>([
  middleware.requestValidationForSchema({
    oneOf: [{
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: {
          type: 'string',
          minLength: 6,
          maxLength: 18,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{6,18})', },
      },
      required: ['email', 'password']
    }, {
      type: 'object',
      properties: {
        token: { type: 'string', minLength: 1 },
        type: { type: 'string', enum: ['facebook', 'google', 'untappd'] },
      },
      required: ['token', 'type']
    }]
  }),
  async function getTokenMiddleware (ctx) {
    const { email, password, token, type } = ctx.request.body

    let authResponse
    if (token && type) authResponse = await ctx.services.auth.getAuthFromToken(token, type)
    if (email && password) authResponse = await ctx.services.auth.getAuthFromEmailPassword(email, password)
    if (!authResponse) {
      ctx.status = 400
      return
    }

    const { status } = authResponse
    ctx.status = status
    if (authResponse.error) ctx.body = authResponse.error
    if (status !== 200 || !authResponse.auth) return

    const tokenResponse = await ctx.services.token.createTokenFromAuth(authResponse.auth)
    ctx.status = tokenResponse.status
    if (tokenResponse.error) {
      ctx.body = tokenResponse.error
      return
    }

    ctx.body = {
      token: tokenResponse.accessToken,
      expiresAt: new Date(tokenResponse.accessTokenExpiry * 1000).toISOString(),
      expiresInMs: Date.now()
    }
    ctx.cookies.set('refresh_token', tokenResponse.refreshToken, {
      http_only: true,
      max_age: tokenResponse.refreshExpiry,
      expires: new Date(tokenResponse.refreshExpiry * 1000),
      ...config.cookie.opts })
  }
])
