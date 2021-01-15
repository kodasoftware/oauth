import * as should from 'should'
import getTokenMiddleware from '../../src/middleware/get-token'
import { attachAuthContext } from '../../src/app'
import Koa from 'koa'
import config from '../../src/config'
import Chance from 'chance'
import { clearDataset } from '../utils'
import { Auth } from '../../src/database'
import requestPromise from 'request-promise'
import nock from 'nock'

const APP = attachAuthContext(new Koa()).use(getTokenMiddleware)
const KNEX = APP.context.database
const CHANCE = new Chance()
const URL = 'http://localhost:' + config.app.port

describe('getTokenMiddleware', () => {
  let server
  let auth
  let email
  let password
  let token
  before(() => {
    server = APP.listen(config.app.port)
    nock(/stripe/i)
      .post(/v1\/customers/i).reply(201, (uri, body, callback) => {
        callback(null, { id: 'cus_' + CHANCE.string() })
      })
  })
  beforeEach(async () => {
    email = CHANCE.email()
    password = 'aVal1dP@ss'
    await clearDataset([Auth.TABLE])
    const response = await APP.context.services.auth.createFromEmailPassword(email, password)
    token = await APP.context.services.token.createTokenFromAuth(response.auth)
    const stripeRes = await APP.context.services.stripe.createCustomerForAuth(response.auth)
    auth = stripeRes.auth
  })
  after(() => {
    server.close()
    nock.cleanAll()
  })
  it('should return an access token and refresh token cookie for email password', async () => {
    const response = await requestPromise(URL,
      { method: 'post', body: { email, password }, json: true, resolveWithFullResponse: true })
    response.statusCode.should.be.eql(200)
    response.headers.should.have.properties(['set-cookie'])
    response.headers['set-cookie'].should.be.Array()
    response.body.should.have.properties(['token', 'expiresAt'])
  })
  it('should return 401 for invalid password', async () => {
    const response = await requestPromise(URL,
      { method: 'post', body: { email, password: 'd4A@mamn' }, json: true, resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
  it('should return 400 for unknown email', async () => {
    const response = await requestPromise(URL,
      { method: 'post', body: { email: CHANCE.email(), password }, json: true, resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(404) })
    should.not.exist(response)
  })
  it('should return 401 for deleted auth', async () => {
    await APP.context.services.auth.deleteFromIdEmail(auth.id, auth.email)
    const response = await requestPromise(URL,
      { method: 'post', body: { email, password }, json: true, resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
})
