import * as should from 'should'
import updateAuthMiddleware from '../../src/middleware/update-auth'
import { attachAuthContext } from '../../src/app'
import Koa from 'koa'
import config from '../../src/config'
import Chance from 'chance'
import { clearDataset } from '../utils'
import { Auth } from '../../src/database'
import requestPromise from 'request-promise'
import jwt from 'jsonwebtoken'

const APP = attachAuthContext(new Koa()).use(updateAuthMiddleware)
const KNEX = APP.context.database
const CHANCE = new Chance()
const URL = 'http://localhost:' + config.app.port

describe('updateAuthMiddleware', () => {
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
  it('should update email for valid token and payload', async () => {
    const newEmail = CHANCE.email()
    const response = await requestPromise(URL, {
      method: 'post', body: { email: newEmail },
      headers: { Authorization: 'Bearer ' + token.accessToken }, json: true,
      resolveWithFullResponse: true
    })
    response.statusCode.should.be.eql(200)
    const record = await APP.context.database.from(Auth.TABLE).where({ email: newEmail }).first()
    should.exist(record)
    record.id.should.be.eql(auth.id)
    record.email.should.not.eql(auth.email)
  })
  it('should update password for valid token and payload', async () => {
    const newPassword = 'mYn3WP@ss'
    const response = await requestPromise(URL, {
      method: 'post', body: { existing: password, password: newPassword },
      headers: { Authorization: 'Bearer ' + token.accessToken }, json: true,
      resolveWithFullResponse: true
    })
    response.statusCode.should.be.eql(200)
    const { status, auth: _auth } = await APP.context.services.auth.getAuthFromEmailPassword(email, newPassword)
    status.should.be.eql(200)
    should.exist(_auth)
    _auth.id.should.be.eql(auth.id)
    _auth.password.should.not.be.eql(auth.password)
    _auth.salt.should.not.be.eql(auth.salt)
  })
  it('should return 401 for invalid token', async () => {
    const invalidToken = await jwt.sign({ email: CHANCE.email, sub: CHANCE.guid() }, config.jwt.secret, { expiresIn: -10 })
    const response = await requestPromise(URL, {
      method: 'post', body: { email: CHANCE.email() },
      headers: { Authorization: 'Bearer ' + invalidToken }, json: true,
      resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
  it('should return 400 for invalid email', async () => {
    const response = await requestPromise(URL, {
      method: 'post', body: { email: CHANCE.integer() },
      headers: { Authorization: 'Bearer ' + token.accessToken }, json: true,
      resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(400) })
    should.not.exist(response)
  })
  it('should return 401 for incorrect existing password', async () => {
    const response = await requestPromise(URL, {
      method: 'post', body: { existing: 'n0Tm@3Exist', password: 'mYn3WP@ss' },
      headers: { Authorization: 'Bearer ' + token.accessToken }, json: true,
      resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
  it('should return 400 for invalid existing', async () => {
    const response = await requestPromise(URL, {
      method: 'post', body: { existing: CHANCE.integer(), password: 'mYn3WP@ss' },
      headers: { Authorization: 'Bearer ' + token.accessToken }, json: true,
      resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(400) })
    should.not.exist(response)
  })
  it('should return 400 for invalid new password', async () => {
    const response = await requestPromise(URL, {
      method: 'post', body: { existing: 'mYn3WP@ss', password: CHANCE.integer() },
      headers: { Authorization: 'Bearer ' + token.accessToken }, json: true,
      resolveWithFullResponse: true })
    .catch(err => { err.statusCode.should.be.eql(400) })
    should.not.exist(response)
  })
})
