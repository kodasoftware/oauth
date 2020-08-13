import Knex from 'knex'

export default class Repository {
  constructor(
    private readonly knex: Knex,
  ) {}
  public insert<Q>(table: string, data: Q, trx?: Knex.Transaction): Promise<Q> {
    const now = new Date().toISOString()
    const query = this.knex.table(table).insert({ ...data, created_at: now, updated_at: now }).returning('*') as any
    if (trx) query.transacting(trx)
    return query
  }

  public upsert<Q>(
    table: string,
    data: { [key: string]: any },
    fields?: string[],
    upsert?: { [key: string]: any },
    trx?: Knex.Transaction
  ): Knex.QueryBuilder<Q,Q> {
    const now = new Date().toISOString()
    const insert = this.knex.table(table).insert({ ...data, created_at: now, updated_at: now })
    const conflicts = fields && fields.length > 0 && fields.join(', ') || Object.keys(data).join(', ')
    const updates = this.knex.update(upsert || data)
    const conflictStmnt = 'ON CONFLICT (' + conflicts + ') DO ' + updates.toQuery() + ', updated_at = \'' + now + '\''
    const query = this.knex.raw(insert.toQuery() + ' ' + conflictStmnt) as any
    if (trx) query.transacting(trx)
    return query
  }

  public delete(table: string, data: { [key: string]: any }, trx?: Knex.Transaction): Knex.QueryBuilder {
    const query = this.knex.table(table).where(data).delete()
    if (trx) query.transacting(trx)
    return query
  }

  public query<Q>(table: string, where?: { [key:string]: any }, trx?: Knex.Transaction): Promise<Q[]> {
    const q = this.knex.table(table)
    if (where) q.where(where)
    if (trx) q.transacting(trx)
    return q
  }

  public find<Q>(table: string, where: { [key: string]: any }, trx?: Knex.Transaction): Promise<Q> {
    const query = this.knex.table(table).where(where).first()
    if (trx) query.transacting(trx)
    return query
  }

  public transact(transaction: (trx: Knex.Transaction) => Promise<any>): Promise<any> {
    return this.knex.transaction(transaction)
  }
}