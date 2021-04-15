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
    },
    required: ['token'],
  }),
  async (ctx) => {
    const { token } = ctx.request.query
    try {
      await jwt.verify(token, config.jwt.secret)
      ctx.status = 200
    } catch (err) {
      ctx.status = 401
    }
  },
])
