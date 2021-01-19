export interface AuthRecord {
  id: string,
  name: string,
  email: string,
  verified: boolean,
  stripe_customer_id: string,
  password: string,
  salt: string,
  reset_token: string,
  deleted: boolean,
}

export interface AuthJson {
  name: string,
  email: string,
  stripe_customer_id: string,
  verified: boolean,
  deleted: boolean,
}
