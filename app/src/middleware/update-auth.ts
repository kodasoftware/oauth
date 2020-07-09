import compose from 'koa-compose'
import { AuthContextWithAuthorization } from './context'
import { middleware } from '@kodasoftware/koa-bundle'
import authMiddleware from '../lib/middleware'

export default compose<AuthContextWithAuthorization>([
  authMiddleware,
  middleware.requestValidationForSchema({
    anyOf: [{
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
      required: ['email'],
    }, {
      type: 'object',
      properties: {
        password: { type: 'string', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{6,18})' },
        existing: { type: 'string', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{6,18})' },
      },
      required: ['password', 'existing'],
    }]
  }),
  async (ctx) => {
    const { sub, email } = ctx.state.auth
    const { email: newEmail, password, existing } = ctx.request.body
    const authResponse = await ctx.services.auth.getAuthFromIdEmail(sub, email)
    const { status } = authResponse
    ctx.status = status
    if (authResponse.error) ctx.body = authResponse.error
    if (status !== 200 || !authResponse.auth) return

    let { auth } = authResponse
    if (newEmail) auth.email = newEmail
    if (password && existing) {
      const updateResponse = await ctx.services.auth.updateAuthPassword(auth, existing, password)
      if (updateResponse.status !== 200) {
        ctx.status = updateResponse.status
        if (updateResponse.error) ctx.body = updateResponse.error
        return
      }
      auth = updateResponse.auth
    }
    await auth.save()
    ctx.status = 200
  }
])