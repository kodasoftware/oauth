import * as should from 'should'
import getTokenMiddleware from '../../src/middleware/get-token'
import refreshTokenMiddleware from '../../src/middleware/refresh-token'
import { attachAuthContext } from '../../src/app'
import Koa from 'koa'
import config from '../../src/config'
import Chance from 'chance'
import { clearDataset } from '../utils'
import { Auth } from '../../src/database'
import requestPromise from 'request-promise'
import { mount } from '@kodasoftware/koa-bundle/mount'

const APP = attachAuthContext(new Koa()).use(mount('/token', getTokenMiddleware)).use(refreshTokenMiddleware)
const KNEX = APP.context.database
const CHANCE = new Chance()
const URL = 'http://localhost:' + config.app.port

describe('refreshTokenMiddleware', () => {
  let server
  let email
  let password
  before(() => server = APP.listen(config.app.port))
  beforeEach(async () => {
    email = CHANCE.email()
    password = 'aVal1dP@ss'
    await clearDataset([Auth.TABLE])
    await APP.context.services.auth.createFromEmailPassword(email, password)
  })
  after(() => server.close())
  it('should refresh a valid refresh token', async () => {
    const jar = requestPromise.jar()
    await requestPromise(URL + '/token', { method: 'POST', body: { email, password }, json: true, jar })
    const response = await requestPromise(URL, { method: 'get', jar, resolveWithFullResponse: true, json: true })
    response.headers.should.have.properties(['set-cookie'])
    response.body.should.have.properties(['token', 'expiresAt'])
  })
  it('should return 401 if no cookie is set', async () => {
    const response = await requestPromise(URL, { method: 'get', resolveWithFullResponse: true, json: true })
    .catch((err) => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
})
