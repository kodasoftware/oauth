import * as should from 'should'
import createAuthMiddleware from '../../src/middleware/create-auth'
import { attachAuthContext } from '../../src/app'
import nock from 'nock'
import Koa from 'koa'
import config from '../../src/config'
import requestPromise from 'request-promise'
import Chance from 'chance'
import facebook from '../users/fb-user.json'
import google from '../users/google-user.json'

const CHANCE = Chance()

describe('createAuthMiddleware', () => {
  const url = 'http://localhost:' + config.app.port
  const koa = attachAuthContext(new Koa())
  koa.use(createAuthMiddleware)
  let server
  before(async () => {
    server = await koa.listen(config.app.port)
    nock(/stripe/i)
      .post(/v1\/customers/i).reply(201, (uri, body, callback) => {
        callback(null, { id: 'cus_' + CHANCE.string() })
      })
  })
  after(() => {
    server.close()
    nock.cleanAll()
  })

  it('should return 201 for valid name, email password', async () => {
    const name = CHANCE.name({ full: true })
    const email = CHANCE.email()
    const password = 'BlueJ4ys@'
    const response = await requestPromise(url, {
      method: 'post', body: { name, email, password }, json: true, resolveWithFullResponse: true })
    response.statusCode.should.be.eql(201)
  })
  it.skip('should return 201 for valid facebook token', async ()  => {
    const response = await requestPromise(url, {
      method: 'post', body: { token: facebook.token, type: 'facebook' }, json: true, resolveWithFullResponse: true })
    response.statusCode.should.be.eql(201)
  })
  it.skip('should return 201 for valid google token', async ()  => {
    const response = await requestPromise(url, {
      method: 'post', body: { token: google.token, type: 'google' }, json: true, resolveWithFullResponse: true })
    response.statusCode.should.be.eql(201)
  })
  it('should return 400 for invalid name', async () => {
    const name = CHANCE.floating()
    const email = 'this.isiansoalkmas'
    const password = 'icecr3Am@'
    const response = await requestPromise(url, {
      method: 'post', body: { name, email, password }, json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(400) })
    should.not.exist(response)
  })
  it('should return 400 for invalid email', async () => {
    const name = CHANCE.name({ full: true })
    const email = 'this.isiansoalkmas'
    const password = 'icecr3Am@'
    const response = await requestPromise(url, {
      method: 'post', body: { name, email, password }, json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(400) })
    should.not.exist(response)
  })
  it('should return 400 for invalid password', async () => {
    const name = CHANCE.name({ full: true })
    const email = CHANCE.email()
    const password = 'invalidpassword'
    const response = await requestPromise(url, {
      method: 'post', body: { name, email, password }, json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(400) })
    should.not.exist(response)
  })
  it('should return 401 for invalid facebook token', async () => {
    const token = CHANCE.string()
    const response = await requestPromise(url, {
      method: 'post', body: { token, type: 'facebook' }, json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
  it('should return 400 for invalid google token', async () => {
    const token = CHANCE.string()
    const response = await requestPromise(url, {
      method: 'post', body: { token, type: 'google' }, json: true, resolveWithFullResponse: true })
    .catch((err) => { err.statusCode.should.be.eql(401) })
    should.not.exist(response)
  })
})
