export interface AuthRecord {
  id: string,
  email: string,
  verified: boolean,
  stripe_customer_id: string,
  password: string,
  salt: string,
  reset_token: string,
  deleted: boolean,
}

export interface AuthJson {} // tslint:disable-line
