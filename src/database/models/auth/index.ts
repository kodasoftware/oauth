import { v4 } from 'uuid'
import Model from '../../models'
import { AuthRecord, AuthJson } from './schema'
import logger from '../../../logger'
import Repository from '../../repository'

export class Auth extends Model<AuthRecord, AuthJson> {
  public static TABLE = 'auth'
  public static CONFLICTS = ['id']
  public static create(
    email: string,
    password: string,
    salt: string,
    deleted: boolean,
  ): (repository: Repository) => Promise<Auth> {
    return async (repository: Repository) => {
      try {
        const auth = new Auth(repository, email.toLowerCase(), false, password, salt, deleted)
        await auth.save()
        return auth
      } catch (err) {
        logger.error(err)
      }
      return null
    }
  }
  public static find(email: string): (repository: Repository) => Promise<Auth> {
    return async (repository: Repository) => {
      const result = await repository.find<AuthRecord>(Auth.TABLE, { email: email.toLowerCase() })
      if (!result) {
        return null
      }
      return new Auth(
        repository,
        result.email,
        Boolean(result.verified),
        result.password,
        result.salt,
        Boolean(result.deleted),
        result.id,
        result.reset_token,
        result.stripe_customer_id,
        result.name,
        result.untappd_token,
        result.invite_tokens,
      )
    }
  }
  constructor(
    repository: Repository,
    public email: string,
    public verified: boolean,
    public password: string,
    public salt: string,
    public deleted: boolean = false,
    public id: string = v4(),
    public resetToken: string = null,
    public stripeCustomerId: string = null,
    public name: string = null,
    public untappd_token: string = null,
    public invite_tokens: number = 3,
  ) {
    super(Auth.TABLE, Auth.CONFLICTS, repository)
  }

  toRecord() {
    return {
      id: this.id,
      name: this.name,
      email: this.email ? this.email.toLowerCase() : '',
      verified: this.verified,
      password: this.password,
      salt: this.salt,
      deleted: this.deleted,
      reset_token: this.resetToken,
      stripe_customer_id: this.stripeCustomerId,
      untappd_token: this.untappd_token,
      invite_tokens: this.invite_tokens,
    }
  }

  toJson() {
    return {
      name: this.name,
      email: this.email,
      stripe_customer_id: this.stripeCustomerId,
      untappd_token: this.untappd_token,
      invite_tokens: this.invite_tokens,
      verified: this.verified,
      deleted: this.deleted,
    }
  }
}