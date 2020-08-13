import bcrypt from 'bcrypt'
import { Auth } from '../models/auth'
import logger from '../../logger'
import Repository from '../repository'
import * as FB from '../../lib/facebook'
import * as google from '../../lib/google'
import Knex from 'knex'

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

  public async getAuthFromToken(token: string, type: 'facebook' | 'google'): Promise<AuthServiceResponse> {
    try {
      const user = (type === 'facebook') ? await FB.validateToken(token) : await google.validateToken(token)
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

  public async createFromToken(token: string, type: 'facebook' | 'google'): Promise<AuthServiceResponse> {
    try {
      const user = (type === 'facebook') ? await FB.validateToken(token) : await google.validateToken(token)
      if (!user) return { status: 401 }
      const email = user && user.email || null
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
        const auth = await Auth.create(email, null, null, false)(this.repository)
        if (!auth) return { status: 409 }
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
      if (await this.compare(existing, auth.password)) {
        const { salt, encrypted } = await this.encrypt(password)
        auth.password = encrypted
        auth.salt = salt
        return { status: 200, auth }
      }
      return { status: 401 }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || 500, error: err.error || err.message || err } as any
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
    return bcrypt.compare(password, encrypted)
  }

  protected async encrypt(password: string): Promise<{ salt: string, encrypted: string }> {
    const salt = await bcrypt.genSalt(8)
    const encrypted = await bcrypt.hash(password, salt)
    return { salt, encrypted }
  }
}