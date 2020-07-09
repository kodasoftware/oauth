import * as should from 'should'
import deleteAuthMiddleware from '../../src/middleware/delete-auth'
import { attachAuthContext } from '../../src/app'
import Koa from 'koa'
import config from '../../src/config'
import Chance from 'chance'
import { clearDataset } from '../utils'
import { Auth } from '../../src/database'
import requestPromise from 'request-promise'

const APP = attachAuthContext(new Koa()).use(deleteAuthMiddleware)
const KNEX = APP.context.database
const CHANCE = new Chance()
const URL = 'http://localhost:' + config.app.port

describe('deleteAuthMiddleware', () => {
  let server
  let auth
  let email
  let password
  let token
  before(() => server = APP.listen(config.app.port))
  beforeEach(async () => {
    email = CHANCE.email()
    password = CHANCE.string()
    await clearDataset([Auth.TABLE])
    const response = await APP.context.services.auth.createFromEmailPassword(email, password)
    token = await APP.context.services.token.createTokenFromAuth(response.auth)
    auth = response.auth
  })
  after(() => server.close())
  it('should return 200 for a valid email password', async () => {
    const response = await requestPromise(URL, {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + token.accessToken },
      json: true, 
      resolveWithFullResponse: true })
    response.statusCode.should.be.eql(200)
    const record = await KNEX.from(Auth.TABLE).where({ email }).first()
    record.deleted.should.be.eql(1)
  })
  it('should return 404 for an unknown email', async () => {
    token = await APP.context.services.token.createTokenFromAuth({ id: CHANCE.guid(), email: CHANCE.email() })
    const response = await requestPromise(URL, {
      method: 'delete',
      headers: { Authorization: 'Bearer ' + token.accessToken },
      json: true,
      resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(404) })
    should.not.exist(response)
  })
  it('should return 401 for no authorization header set', async () => {
    const response = await requestPromise(URL, { method: 'delete', json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
})
