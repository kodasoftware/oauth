import { middleware } from '@kodasoftware/koa-bundle'
import { mount } from '@kodasoftware/koa-bundle/mount'
import compose from 'koa-compose'
import Koa from 'koa'
import { Server } from 'http'
import config from './config'
import logger from './logger'
import ping from './routes/ping'
import auth from './routes/auth'
import token from './routes/token'
import * as knexfile from '../knexfile'
import Knex from 'knex'
import { AuthService } from './database/service'
import TokenService from './lib/token'

export function attachAuthContext(koa: Koa): Koa {
  const kn = Knex(knexfile)
  koa.context.database = kn
  koa.context.services = {
    auth: new AuthService(kn),
    token: new TokenService(),
  }
  koa.keys = config.cookie.keys
  koa.use(middleware.composedMiddlewares(config.app.name, config.log.level, null, {
    body: { includeUnparsed: false },
    cors: config.app.cors,
  }))
  return koa
}

export default class App {
  public readonly knex: Knex
  public readonly koa?: Koa
  private server: Server
  constructor() {
    this.koa = new Koa().use(mount(config.app.prefix + '/ping', compose([ping.routes(), ping.allowedMethods()])))
    this.koa = attachAuthContext(this.koa)
    this.koa
      .use(mount(config.app.prefix + '/auth', compose([auth.routes(), auth.allowedMethods()])))
      .use(mount(config.app.prefix + '/token', compose([token.routes(), token.allowedMethods()])))
  }
  async start(port?: string) {
    this.server = this.koa.listen(port || config.app.port)
    logger.info(config.app.name + ' service listening on port ' + config.app.port)
  }
  close() {
    if (this.server) this.server.close()
  }
}
