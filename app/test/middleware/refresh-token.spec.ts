import * as should from 'should'
import refreshTokenMiddleware from '../../src/middleware/refresh-token'
import { attachAuthContext } from '../../src/app'
import Koa from 'koa'
import config from '../../src/config'
import Chance from 'chance'
import { clearDataset } from '../utils'
import { Auth } from '../../src/database'
import requestPromise from 'request-promise'

const APP = attachAuthContext(new Koa()).use(refreshTokenMiddleware)
const KNEX = APP.context.database
const CHANCE = new Chance()
const URL = 'http://localhost:' + config.app.port

describe('refreshTokenMiddleware', () => {
  let server
  let auth
  let email
  let password
  let token
  before(() => server = APP.listen(config.app.port))
  beforeEach(async () => {
    email = CHANCE.email()
    password = 'aVal1dP@ss'
    await clearDataset([Auth.TABLE])
    const response = await APP.context.services.auth.createFromEmailPassword(email, password)
    token = await APP.context.services.token.createTokenFromAuth(response.auth)
    auth = response.auth
  })
  after(() => server.close())
  it('should refresh a valid refresh token', async () => {
    const jar = requestPromise.jar()
    jar.setCookie('refresh_token=' + token.refreshToken, URL, { http: false, secure: false })
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
