import { AuthContext } from './context'
import config from '../config'

export default async function refreshTokenMiddleware(ctx: AuthContext) {
  const [type, accessToken] = ctx.request.headers.authorization ? ctx.request.headers.authorization.split(' ') : []
  const refreshToken = ctx.cookies.get('refresh_token', config.cookie.opts)
  if (!refreshToken && !accessToken) {
    ctx.status = 401
    return
  }

  const verified = await ctx.services.token.verifyToken(refreshToken || accessToken)
  if (!verified) {
    ctx.status = 401
    return
  }
  const { sub, email } = verified

  const authResponse = await ctx.services.auth.getAuthFromIdEmail(sub, email)
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
    expiresAt: new Date(tokenResponse.accessTokenExpiry * 1000).toISOString()
  }
  ctx.cookies.set('refresh_token', tokenResponse.refreshToken, {
    max_age: tokenResponse.refreshExpiry,
    expires: new Date(tokenResponse.refreshExpiry * 1000),
    ...config.cookie.opts,
  })
}
