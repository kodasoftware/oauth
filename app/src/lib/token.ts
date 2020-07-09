import jwt from 'jsonwebtoken'
import { Auth } from '../database/models/auth'
import config from '../config'
import logger from '../logger'

export interface TokenServiceResponse {
  status: number,
  accessToken?: string,
  accessTokenExpiry?: number,
  refreshToken?: string,
  refreshExpiry?: number,
  resetToken?: string,
  resetExpiry?: number,
  error?: any,
}

export default class TokenService {
  public async createTokenFromAuth(auth: Auth): Promise<TokenServiceResponse> {
    try {
      const accessTokenExpiry = Math.floor(Date.now() / 1000) + config.jwt.durationSecs
      const accessToken = await jwt.sign({
        email: auth.email,
        exp: accessTokenExpiry,
        sub: auth.id,
      }, config.jwt.secret)
      const refreshExpiry = Math.floor(Date.now() / 1000) + config.jwt.refreshDurationSecs
      const refreshToken = await jwt.sign({
        email: auth.email,
        exp: refreshExpiry,
        sub: auth.id,
      }, config.jwt.secret)
      return { status: 200, accessToken, accessTokenExpiry, refreshToken, refreshExpiry }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || err.status || 500, error: err.error || err.message || err }
    }
  }

  public async createResetPasswordToken(auth: Auth): Promise<TokenServiceResponse> {
    try {
      const resetExpiry = Math.floor(Date.now() / 1000) + config.jwt.resetDurationSecs
      const resetToken = await jwt.sign({
        email: auth.email,
        exp: resetExpiry,
        sub: auth.id,
      }, config.crypto.secret)
      auth.resetToken = resetToken
      await auth.save()
      return { status: 200, resetToken, resetExpiry }
    } catch (err) {
      logger.error(err)
      return { status: err.statusCode || err.status || 500, error: err.error || err.message || err }
    }
  }

  public async verifyRefreshToken(refreshToken: string): Promise<any> {
    try {
      const token = await jwt.verify(refreshToken, config.jwt.secret) as any
      const now = Date.now() / 1000
      if (token.exp <= now) return false
      return token
    } catch (err) {
      logger.error(err)
      return false
    }
  }
}