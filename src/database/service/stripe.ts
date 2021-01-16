import { Auth } from '../models/auth'
import { Stripe as StripeI } from 'stripe'
import logger from '../../logger'

const STRIPE = require('stripe')

export interface Customer {
  id: string,
}
export interface StripeServiceResponse {
  status: number,
  error?: any,
  auth?: Auth,
}

export class StripeService {
  protected readonly stripe: StripeI
  constructor(apiKey: string) {
    this.stripe = STRIPE(apiKey)
  }
  public async createCustomerForAuth(auth: Auth): Promise<StripeServiceResponse> {
    try {
      const customer = await this.stripe.customers.create({
        email: auth.email,
        metadata: { auth_id: auth.id, deleted: auth.deleted ? 1 : 0 }
      })
      auth.stripeCustomerId = customer.id
      await auth.save()
      return { status: 201, auth }
    } catch (err) {
      return { status: err.status || 500, error: err, auth }
    }
  }
  public async updateCustomerFromAuth(auth: Auth): Promise<StripeServiceResponse> {
    try {
      if (!auth.stripeCustomerId) return { status: 400, error: 'No Stripe customer exists for user' }
      const customer = await this.stripe.customers.update(auth.stripeCustomerId, {
        email: auth.email,
        metadata: { deleted: auth.deleted ? 1 : 0 },
      })
      auth.stripeCustomerId = customer.id
      await auth.save()
      return { status: 200, auth }
    } catch (err) {
      logger.error(err)
      return { status: err.status || 500, error: err, auth }
    }
  }
}