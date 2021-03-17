import { v5 } from 'uuid'
import Model from '../../models'
import { InviteeRecord, InviteeJson } from './schema'
import logger from '../../../logger'
import Repository from '../../repository'
import { Auth } from '../auth'

export class Invitee extends Model<InviteeRecord, InviteeJson> {
  public static TABLE = 'invitee'
  public static CONFLICTS = ['email']
  public static create(
    auth: Auth,
    email: string,
    token: string,
  ): (repository: Repository) => Promise<Invitee> {
    return async (repository: Repository) => {
      try {
        const invite = new Invitee(repository, email.toLowerCase(), auth.id, token)
        await invite.save()
        return invite
      } catch (err) {
        logger.error(err)
      }
      return null
    }
  }
  public static findByEmail(email: string): (repository: Repository) => Promise<Invitee> {
    return async (repository: Repository) => {
      const result = await repository.find<InviteeRecord>(Invitee.TABLE, { email })
      if (!result) {
        return null
      }
      return new Invitee(
        repository,
        result.email,
        result.inviter_id,
        result.token,
        result.active,
      )
    }
  }
  public static findByToken(token: string): (repository: Repository) => Promise<Invitee> {
    return async (repository: Repository) => {
      const result = await repository.find<InviteeRecord>(Invitee.TABLE, { token })
      if (!result) {
        return null
      }
      return new Invitee(
        repository,
        result.email,
        result.inviter_id,
        result.token,
        result.active,
      )
    }
  }
  constructor(
    repository: Repository,
    public email: string,
    public inviter_id: string,
    public token?: string,
    public active: boolean = true,
  ) {
    super(Invitee.TABLE, Invitee.CONFLICTS, repository)
  }

  toRecord() {
    return {
      email: this.email,
      inviter_id: this.inviter_id,
      token: this.token,
      active: this.active,
    }
  }

  toJson() {
    return {
      email: this.email,
      inviter_id: this.inviter_id,
      active: this.active,
    }
  }
}