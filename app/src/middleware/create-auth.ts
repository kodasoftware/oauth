import compose from 'koa-compose'
import { middleware } from '@kodasoftware/koa-bundle'
import { AuthContext } from './context'

export default compose<AuthContext>([
  middleware.requestValidationForSchema({
    oneOf: [{
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: {
          type: 'string',
          minLength: 6,
          maxLength: 18,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{6,18})',
        },
        additionalProperties: true,
      },
      required: ['email', 'password'],
    }, {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['facebook', 'google'] },
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
    
    const { status, error } = response
    ctx.status = status
    if (error) ctx.body = error
  }
])
