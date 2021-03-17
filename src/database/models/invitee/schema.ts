export interface InviteeRecord {
  inviter_id: string,
  email: string,
  token: string,
  active: boolean,
}

export interface InviteeJson {
  inviter_id: string,
  email: string,
  active: boolean,
}
