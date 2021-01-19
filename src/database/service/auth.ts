import bcrypt from 'bcrypt'
import Knex from 'knex'
import { Auth } from '../models/auth'
import logger from '../../logger'
import Repository from '../repository'
import * as FB from '../../lib/facebook'
import * as google from '../../lib/google'
import * as untappd from '../../lib/untappd'

export interface AuthServiceResponse {
  status: number,
  auth?: Auth,
  error?: any,
}

export class AuthService {
  private readonly repository: Repository
  constructor(
    knex: Knex,
  ) {
    this.repository = new Repository(knex)
  }

  public async getAuthFromIdEmail(id: string, email: string): Promise<AuthServiceResponse> {
    try {
      const auth = await Auth.find(email)(this.repository)
      if (!auth) return { status: 404 }
      if (!auth.deleted && auth.id === id) return { status: 200, auth }

      return { status: 401 } as any
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  public async getAuthFromToken(token: string, type: 'facebook' | 'google' | 'untappd'): Promise<AuthServiceResponse> {
    try {
      let user
      switch (type) {
        case 'facebook':
          user = await FB.validateToken(token)
          break
        case 'google':
          user = await google.validateToken(token)
          break
        case 'untappd':
          user = await untappd.validateToken(token)
          break
      }
      logger.debug('Got auth for type', type, 'with response', user)
      if (!user) return { status: 404 }
      const email = user && user.email || null
      const auth = await Auth.find(email)(this.repository)

      if (!auth) return { status: 404 }
      if (!auth.deleted) return { status: 200, auth }

      return { status: 401 } as any
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  public async getAuthFromEmailPassword(email: string, password: string): Promise<AuthServiceResponse> {
    try {
      const auth = await Auth.find(email)(this.repository)
      if (!auth) return { status: 404 }
      if (!auth.password) return { status: 401 }
      const match = await this.compare(password, auth.password)
      if (auth.deleted || !match) return { status: 401 }
      if (auth.password !== null) {
        return { status: 200, auth }
      }
      return { status: 401 } as any
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  public async createFromEmailPassword(email: string, password: string): Promise<AuthServiceResponse> {
    try {
      const { auth: existing } = await this.verifyEmailExists(email)
      if (existing && !existing.deleted) {
        return { status: 409 }
      }
      if (existing && existing.deleted && await this.compare(password, existing.password)) {
        existing.deleted = false
        await existing.save()
        return { status: 201, auth: existing }
      }
      const { salt, encrypted } = await this.encrypt(password)
      const auth = await Auth.create(email, encrypted, salt, false)(this.repository)
      if (!auth) return { status: 409 }
      return { status: 201, auth }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  public async createFromToken(token: string, type: 'facebook' | 'google' | 'untappd'): Promise<AuthServiceResponse> {
    try {
      let user
      let email
      let name
      let password
      switch (type) {
        case 'facebook':
          user = await FB.validateToken(token)
          if (user) {
            let [first, last, lastOverride] = (user.name_format as string).trim().substring(1).substring(0, user.name_format.length - 2).split('} {')
            const names = []
            if (first) names.push(user[first + '_name'])
            if (last) names.push(user[last + '_name'])
            if (lastOverride) names.push(user[lastOverride + '_name'])
            name = names.join(' ')
            password = user.id
            logger.debug('setting user information', { name, id: user.id })
          }
          break
        case 'google':
          user = await google.validateToken(token)
          break
        case 'untappd':
          user = await untappd.validateToken(token)
          break
      }
      logger.debug('Got auth for type', type, 'with response', user)
      if (!user) return { status: 401 }
      email = user && user.email || null
      if (email) {
        const { auth: existing } = await this.verifyEmailExists(email)
        if (existing && !existing.deleted) {
          return { status: 409 }
        }
        if (existing && existing.deleted) {
          existing.deleted = false
          await existing.save()
          return { status: 201, auth: existing }
        }
        const { encrypted, salt } = await this.encrypt(password)
        const auth = await Auth.create(email, encrypted, salt, false)(this.repository)
        if (!auth) return { status: 409 }
        if (user.email_verified) {
          auth.verified = true
        }
        auth.name = name
        await auth.save()
        return { status: 201, auth }
      }
      return { status: 400, error: 'Invalid token type' }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  public async deleteFromIdEmail(id: string, email: string): Promise<AuthServiceResponse> {
    try {
      const auth = await Auth.find(email)(this.repository)
      if (!auth) return { status: 404 }
      if (auth.id === id) {
        auth.deleted = true
        await auth.save()
        return { status: 200 }
      }
      return { status: 401 } as any
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  public async updateAuthPassword(auth: Auth, existing: string, password: string): Promise<AuthServiceResponse> {
    try {
      const { salt, encrypted } = await this.encrypt(password)
      if (await this.compare(existing, auth.password)) {
        auth.password = encrypted
        auth.salt = salt
        return { status: 200, auth }
      }
      return { status: 401 }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 400, error: err.error || err.message || err } as any
    }
  }

  public async verifyEmailExists(email: string): Promise<AuthServiceResponse> {
    try {
      const auth = await Auth.find(email)(this.repository)
      return { status: !!auth ? 200 : 404, auth }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
    }
  }

  protected compare(password: string, encrypted: string): Promise<boolean> {
    if (!password) return Promise.resolve(false)
    if (!encrypted) return Promise.resolve(true)
    return bcrypt.compare(password, encrypted)
  }

  protected async encrypt(password: string): Promise<{ salt: string, encrypted: string }> {
    const salt = await bcrypt.genSalt(8)
    const encrypted = await bcrypt.hash(password, salt)
    return { salt, encrypted }
  }
}