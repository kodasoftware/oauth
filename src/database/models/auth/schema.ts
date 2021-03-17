export interface AuthRecord {
  id: string,
  name: string,
  email: string,
  verified: boolean,
  stripe_customer_id: string,
  untappd_token: string,
  invite_tokens: number,
  password: string,
  salt: string,
  reset_token: string,
  deleted: boolean,
}

export interface AuthJson {
  name: string,
  email: string,
  stripe_customer_id: string,
  untappd_token: string,
  invite_tokens: number,
  verified: boolean,
  deleted: boolean,
}
