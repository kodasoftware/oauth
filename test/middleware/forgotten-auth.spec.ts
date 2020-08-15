// This requires you to be running pubsub emulator locally or a remote pubsub
// See npm run start-pubsub
import * as should from 'should'
import forgottenAuthMiddleware from '../../src/middleware/forgotten-auth'
import { attachAuthContext } from '../../src/app'
import config from '../../src/config'
import Koa from 'koa'
import Chance from 'chance'
import requestPromise from 'request-promise'
import { createPubSubTopic, clearDataset } from '../utils'
import { Auth } from '../../src/database'

const APP = attachAuthContext(new Koa()).use(forgottenAuthMiddleware)
const CHANCE = new Chance()
const URL = 'http://localhost:' + config.app.port

describe('forgottenAuthMiddleware', () => {
  const email = CHANCE.email()
  const password = 'G8qNAjabsi12@'
  let server
  let authResponse
  before(async () => {
    await createPubSubTopic()
    server = await APP.listen(config.app.port)
  })
  beforeEach(async () => {
    await clearDataset([Auth.TABLE])
    authResponse = await APP.context.services.auth.createFromEmailPassword(email, password)
  })
  after(() => server && server.close())
  it('should set reset token for forgotten auth', async () => {
    const response = await requestPromise(URL, { qs: { email }, json: true, resolveWithFullResponse: true })
    response.statusCode.should.be.eql(200)
    const { auth } = await APP.context.services.auth.getAuthFromEmailPassword(email, password)
    should.exist(auth)
    should.exist(auth.resetToken)
  })
  it('should return 404 for unknown email', async () => {
    const response = await requestPromise(URL, {
      qs: { email: CHANCE.email() }, json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(404) })
    should.not.exist(response)
  })
})
