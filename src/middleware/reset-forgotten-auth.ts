import compose from 'koa-compose'
import { ServicesContextWithAuthorization } from './context'
import { middleware } from '@kodasoftware/koa-bundle'
import authMiddleware from '../lib/middleware'

export default compose<ServicesContextWithAuthorization>([
  authMiddleware,
  middleware.requestValidationForSchema({
    type: 'object',
    properties: { password: { type: 'string', minLength: 1 } },
    required: ['password']
  }),
  async function resetForgottenAuthMiddleware(ctx) {
    const auth = ctx.state.user
    const { password } = ctx.request.body
    const { status, auth: updated } = await ctx.services.auth.updateForgottenAuth(auth, password)
    await updated.save()
    ctx.status = status
  }
])