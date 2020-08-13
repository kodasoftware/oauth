import { v4 } from 'uuid'
import Model from '..'
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
        result.reset_token)
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
  ) {
    super(Auth.TABLE, Auth.CONFLICTS, repository)
  }

  toRecord() {
    return {
      id: this.id,
      email: this.email.toLowerCase(),
      verified: this.verified,
      password: this.password,
      salt: this.salt,
      deleted: this.deleted,
      reset_token: this.resetToken,
    }
  }

  toJson() {
    return {}
  }
}