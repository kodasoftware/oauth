import { Auth } from '../models/auth'
import { Stripe as StripeI } from 'stripe'

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
        metadata: { auth_id: auth.id }
      })
      auth.stripeCustomerId = customer.id
      await auth.save()
      return { status: 201, auth }
    } catch (err) {
      return { status: err.status || 500, error: err, auth }
    }
  }
}