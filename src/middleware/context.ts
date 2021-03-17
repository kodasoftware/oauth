import { Context } from 'koa'
import { AuthService, StripeService } from '../database/service'
import TokenService from '../lib/token'
import Knex from 'knex'
import { Auth, AuthJson } from '../database'

export type ServicesContext = Context & { body: any, services: { auth: AuthService, token: TokenService, stripe: StripeService }, database: Knex }
export type ServicesContextWithAuthorization = ServicesContext & {
  state: {
    auth: AuthJson & { sub: string, iat: number, exp: number },
    user: Auth,
  }
}
