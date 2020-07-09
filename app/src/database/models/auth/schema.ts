export interface AuthRecord {
  id: string,
  email: string,
  verified: boolean,
  password: string,
  salt: string,
  reset_token: string,
  deleted: boolean,
}

export interface AuthJson {}
