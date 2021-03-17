import * as Knex from 'knex'
import config from '../../config'
import { StripeService } from '../service'
import { AuthService } from '../service/auth'

export async function seed(knex: Knex): Promise<any> {
  const authService = new AuthService(knex)
  const stripe = new StripeService(config.stripe.apiKey)
  // Deletes ALL existing entries
  return knex('auth').del()
    .then(() => {
      return authService.createFromEmailPassword('c_5haw@hotmail.com', 'P4$$w0rd')
    })
    .then(({ auth }) => {
      auth.name = 'Christian Shaw'
      return stripe.createCustomerForAuth(auth)
    })
};
