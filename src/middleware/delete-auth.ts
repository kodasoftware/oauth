import compose from 'koa-compose'
import { ServicesContextWithAuthorization } from './context'
import authMiddleware from '../lib/middleware'

export default compose([
  authMiddleware,
  async function deleteAuthMiddleware(ctx: ServicesContextWithAuthorization) {
    const auth = ctx.state.user
    const { status, error } = await ctx.services.auth.deleteFromIdEmail(auth.id, auth.email)
    ctx.status = status
    if (error) {
      ctx.body = error
      return
    } else {
      const res = await ctx.services.stripe.updateCustomerFromAuth(auth)
      if (res.status !== 200) ctx.status = status
      if (error) ctx.body = error
    }
  },
])
