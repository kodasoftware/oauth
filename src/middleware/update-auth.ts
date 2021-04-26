import compose from 'koa-compose'
import { ServicesContextWithAuthorization } from './context'
import { middleware } from '@kodasoftware/koa-bundle'
import authMiddleware from '../lib/middleware'
import logger from '../logger'

export default compose<ServicesContextWithAuthorization>([
  authMiddleware,
  middleware.requestValidationForSchema({
    anyOf: [{
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1 }
      },
    }, {
      type: 'object',
      properties: {
        password: { type: 'string', minLength: 1 },
        existing: { type: 'string', minLength: 1 },
      },
      required: ['password', 'existing'],
    }]
  }, { removeAdditional: true, useDefaults: true, coerceTypes: true }),
  async (ctx) => {
    const { sub, email } = ctx.state.auth
    const { email: newEmail, name: newName, password, existing } = ctx.request.body
    const authResponse = await ctx.services.auth.getAuthFromIdEmail(sub, email)
    const { status } = authResponse
    ctx.status = status
    if (authResponse.error) ctx.body = authResponse.error
    if (status !== 200 || !authResponse.auth) return

    let { auth } = authResponse
    if (newEmail) auth.email = newEmail
    if (newName) auth.name = newName
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
    if (newEmail || newName) {
      let res
      if (!auth.stripeCustomerId) (res = await ctx.services.stripe.createCustomerForAuth(auth))
      else (res = await ctx.services.stripe.updateCustomerFromAuth(auth))
      ctx.status = [200, 201].includes(res.status) ? 200 : res.status
    }
  }
])
