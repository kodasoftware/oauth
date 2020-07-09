import compose from 'koa-compose'
import { AuthContextWithAuthorization } from './context'
import authMiddleware from '../lib/middleware'

export default compose([
  authMiddleware,
  async function deleteAuthMiddleware(ctx: AuthContextWithAuthorization) {
    const { sub, email } = ctx.state.auth
    const authResponse = await ctx.services.auth.deleteFromIdEmail(sub, email)
    const { status, error } = authResponse
    ctx.status = status
    if (error) ctx.body = error
  },
])
