import * as should from 'should'
import { Auth, AuthRecord, service } from '../../../src/database'
import { getKnex, clearDataset } from '../../utils'
import Chance from 'chance'
import facebook from '../../users/fb-user.json'
import { create } from 'domain'

const KNEX = getKnex()
const SERVICE = new service.AuthService(KNEX)
const CHANCE = new Chance()

describe('Auth Service', () => {
  beforeEach(() => clearDataset([Auth.TABLE]))
  describe('createFromEmailPassword', () => {
    it('should create from an email password', async () => {
      const email = CHANCE.email()
      const password = CHANCE.string()
      const { status, auth, error } = await SERVICE.createFromEmailPassword(email, password)
      status.should.be.eql(201)
      should.not.exist(error)
      auth.should.be.instanceof(Auth)
      auth.email.should.be.eql(email)
      auth.verified.should.be.eql(false)
      auth.deleted.should.be.eql(false)
      should.not.exist(auth.resetToken)
      should.not.exist(auth.name)

      const record = await KNEX.from(Auth.TABLE).where({ email }).first()
      should.exist(record)
      record.verified = Boolean(record.verified)
      record.deleted = Boolean(record.deleted)
      delete record.created_at
      delete record.updated_at
      record.should.be.eql(auth.toRecord())
    })
  })

  describe('createFromToken', () => {
    it.skip('should create from a facebook token', async () => {
      const { status, auth, error } = await SERVICE.createFromToken(facebook.token, 'facebook')
      should.not.exist(error)
      status.should.be.eql(201)
      auth.should.be.instanceof(Auth)
      auth.email.should.be.eql(facebook.email)
      Boolean(auth.verified).should.be.eql(false)
      should.not.exist(auth.password)
      should.not.exist(auth.salt)
      Boolean(auth.deleted).should.be.eql(false)
      should.not.exist(auth.resetToken)

      should.exist(await KNEX.from(Auth.TABLE).where({ email: facebook.email }).first())
    })
  })

  describe('getAuthFromToken', () => {
    let response
    beforeEach(async () => response = await SERVICE.createFromToken(facebook.token, 'facebook'))
    it.skip('should get auth from a token', async () => {
      const { status, error, auth } = await SERVICE.getAuthFromToken(facebook.token, 'facebook')
      status.should.be.eql(200)
      should.not.exist(error)
      should.exist(auth)
      auth.id.should.be.eql(response.auth.id)
      auth.email.should.be.eql(facebook.email)
      should.not.exist(auth.password)
      should.not.exist(auth.salt)
    })
  })

  describe('', () => {
    let email
    let password
    let response
    beforeEach(async () => {
      email = CHANCE.email()
      password = CHANCE.string()
      response = await SERVICE.createFromEmailPassword(email, password) })

    describe('getAuthFromIdEmail', () => {
      it('should get auth from an id email', async () => {
        const { status, error, auth } = await SERVICE.getAuthFromIdEmail(response.auth.id, email)
        status.should.be.eql(200)
        should.not.exist(error)
        should.exist(auth)
        auth.id.should.be.eql(response.auth.id)
        auth.email.should.be.eql(email)
      })
      it('should return 401 from an invalid id', async () => {
        const { status } = await SERVICE.getAuthFromIdEmail(CHANCE.guid(), email)
        status.should.be.eql(401)
      })
      it('should return 404 from an unknown email', async () => {
        const { status } = await SERVICE.getAuthFromIdEmail(response.auth.id, CHANCE.email())
        status.should.be.eql(404)
      })
    })

    describe('getAuthFromEmailPassword', () => {
      it('should get auth from an email password', async () => {
        const { status, error, auth } = await SERVICE.getAuthFromEmailPassword(email, password)
        status.should.be.eql(200)
        should.not.exist(error)
        should.exist(auth)
        auth.id.should.be.eql(response.auth.id)
        auth.email.should.be.eql(email)
      })
      it('should return 401 status from invalid password', async () => {
        const { status } = await SERVICE.getAuthFromEmailPassword(email, CHANCE.string())
        status.should.be.eql(401)
      })
      it('should return 404 status from unknown email', async () => {
        const { status } = await SERVICE.getAuthFromEmailPassword(CHANCE.email(), password)
        status.should.be.eql(404)
      })
    })

    describe('verifyEmailExists', () => {
      it('should get verify email exists', async () => {
        const { status, error, auth } = await SERVICE.verifyEmailExists(email)
        status.should.be.eql(200)
        should.not.exist(error)
        auth.email.should.be.eql(email)

      })
      it('should not verify email exists', async () => {
        const { status, error, auth } = await SERVICE.verifyEmailExists(CHANCE.email())
        status.should.be.eql(404)
        should.not.exist(error)
        should.not.exist(auth)
      })
    })

    describe('deleteFromIdEmail', () => {
      it('should delete auth from id email', async () => {
        const { status, error, auth } = await SERVICE.deleteFromIdEmail(response.auth.id, email)
        status.should.be.eql(200)
        should.not.exist(error)
        should.not.exist(auth)
      })
      it('should return 404 status for unknown email', async () => {
        const { status } = await SERVICE.deleteFromIdEmail(CHANCE.guid(), CHANCE.email())
        status.should.be.eql(404)
      })
      it('should return 401 status for incorrect id', async () => {
        const { status } = await SERVICE.deleteFromIdEmail(CHANCE.guid(), email)
        status.should.be.eql(401)
      })
    })
  })
})
