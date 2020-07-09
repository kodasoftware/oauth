import { Context } from 'koa'
import { AuthService } from '../database/service'
import TokenService from '../lib/token'
import Knex from 'knex'

export type AuthContext = Context & { body: any, services: { auth: AuthService, token: TokenService }, database: Knex }
export type AuthContextWithAuthorization = AuthContext & { state: { auth: any } }
