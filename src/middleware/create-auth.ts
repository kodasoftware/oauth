import compose from 'koa-compose'
import { middleware } from '@kodasoftware/koa-bundle'
import { ServicesContext } from './context'

export default compose<ServicesContext>([
  middleware.requestValidationForSchema({
    oneOf: [{
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 1 },
        additionalProperties: true,
      },
      required: ['name', 'email', 'password'],
    }, {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['facebook', 'google', 'untappd'] },
        token: { type: 'string', minLength: 1 }
      },
      additionalProperties: true,
      required: ['token', 'type']
    }],
  }),
  async (ctx) => {
    const { token, type, email, password } = ctx.request.body
    let response
    if (token && type) {
      response = await ctx.services.auth.createFromToken(token, type)
    }
    if (email && password) {
      response = await ctx.services.auth.createFromEmailPassword(email, password)
    }
    if (!response) {
      ctx.status = 400
      return
    }

    const { status, error, auth } = response
    if (error) {
      ctx.body = error
      ctx.status = status
    } else if (status === 201 && auth) {
      const stripeRes = await ctx.services.stripe.createCustomerForAuth(auth)
      if (stripeRes.error) {
        await ctx.services.auth.deleteFromIdEmail(auth.id, auth.email)
        ctx.status = stripeRes.status
        ctx.body = stripeRes.error
        return
      }
      ctx.status = stripeRes.status
    } else ctx.status = status
  }
])
