import compose from 'koa-compose'
import { ServicesContextWithAuthorization } from './context'
import { middleware } from '@kodasoftware/koa-bundle'
import * as google from '../lib/google'
import config from '../config'
import authMiddleware from '../lib/middleware'

export default compose<ServicesContextWithAuthorization>([
  middleware.requestValidationForSchema({
    type: 'object',
    properties: { email: { type: 'string', format: 'email' } },
    required: ['email']
  }),
  authMiddleware,
  async function sendInviteMiddleware(ctx) {
    const user = ctx.state.user
    const { email } = ctx.request.body

    if (user.invite_tokens <= 0) {
      ctx.status = 404
      ctx.body = 'You do not have any invites left to send'
      return
    }

    const tokenRes = await ctx.services.token.createInviteToken(email)
    const data = {
      from: `"Example App" <foo@example.com>`, // sender address
      to: email,
      subject: 'You have been invited to join our community!', // Subject line
      text: tokenRes.inviteToken, // plain text body
      html: tokenRes.inviteToken,
    }
    const { status, error } = await ctx.services.auth.createInviteForEmail(user, email, tokenRes.inviteToken)
    ctx.status = status
    if (error) ctx.body = error
    if (status === 201) {
      const published = await google.publishMessageToPubSub(config.pubsub.topic, data)
      if (!published) {
        await ctx.services.auth.removeInvite(tokenRes.inviteToken)
        ctx.status = 500
        return
      }
      user.invite_tokens -= 1
      await user.save()
    }
  }
])