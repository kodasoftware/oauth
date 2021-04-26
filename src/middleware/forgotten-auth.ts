import compose from 'koa-compose'
import { ServicesContext } from './context'
import { middleware } from '@kodasoftware/koa-bundle'
import * as google from '../lib/google'
import config from '../config'

export default compose<ServicesContext>([
  middleware.requestValidationForSchema({
    type: 'object',
    properties: { email: { type: 'string', format: 'email' } },
    required: ['email']
  }),
  async function forgottenAuthMiddleware(ctx) {
    const { email } = ctx.query
    const { status, error, auth } = await ctx.services.auth.verifyEmailExists(email)
    ctx.status = status
    if (error) ctx.body = error
    if (!auth) return

    const resetResponse = await ctx.services.token.createResetPasswordToken(auth)
    ctx.status = resetResponse.status
    if (resetResponse.error) ctx.error = resetResponse.error
    if (!resetResponse.resetToken) return

    const data = {
      from: config.email.from, // sender address
      to: auth.email,
      subject: config.email.forgotten.subject, // Subject line
      text: `Your reset token link http://dev.thehopcoop.com/reset-password#${resetResponse.resetToken}`,
      html: `<a href="http://dev.thehopcoop.com/reset-password#${resetResponse.resetToken}">Reset your password</a>`,
    }
    const published = await google.publishMessageToPubSub(config.pubsub.topic, data)
    if (!published) {
      ctx.status = 500
      return
    }
  }
])