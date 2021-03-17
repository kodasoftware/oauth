import compose from 'koa-compose'
import { middleware } from '@kodasoftware/koa-bundle'
import jwt from 'jsonwebtoken'
import config from '../config'
import { ServicesContext } from './context'

export default compose<ServicesContext>([
  middleware.requestValidationForSchema({
    type: 'object',
    properties: {
      token: { type: 'string', minLength: 1 },
      name: { type: 'string', minLength: 1 },
      password: {
        type: 'string',
        minLength: 6,
        maxLength: 18,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{6,18})',
      },
      additionalProperties: true,
    },
    required: ['name', 'token', 'password'],
  }),
  async (ctx, next) => {
    const { token } = ctx.request.body
    try {
      await jwt.verify(token, config.jwt.secret)
      return next()
    } catch (err) {
      ctx.status = 401
    }
  },
  async (ctx) => {
    const { token, name, password } = ctx.request.body
    const inviteResponse = await ctx.services.auth.getInviteForToken(token)

    ctx.status = inviteResponse.status
    if (inviteResponse.status !== 200 || (inviteResponse.invite && !inviteResponse.invite.active)) {
      if (inviteResponse.error) ctx.body = inviteResponse.error
      if (inviteResponse.invite && !inviteResponse.invite.active)
        ctx.body = 'This invitation has expired or has already been used'
      return
    }

    if (!inviteResponse.invite) {
      ctx.status = 500
      ctx.body = 'Could not find invitation for token'
      return
    }

    const response = await ctx.services.auth.createFromEmailPassword(inviteResponse.invite.email, password)
    const { status, error, auth } = response
    if (error) {
      ctx.body = error
      ctx.status = status
    } else if (status === 201 && auth) {
      inviteResponse.invite.active = false
      auth.name = name
      const stripeRes = await ctx.services.stripe.createCustomerForAuth(auth)
      if (stripeRes.error) {
        await ctx.services.auth.deleteFromIdEmail(auth.id, auth.email)
        ctx.status = stripeRes.status
        ctx.body = stripeRes.error
        return
      }
      await inviteResponse.invite.save()
      ctx.status = stripeRes.status
    } else ctx.status = status
  }
])
