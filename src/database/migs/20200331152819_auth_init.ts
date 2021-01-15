import * as Knex from 'knex'

export function up(knex: Knex): Promise<any> {
  return Promise.all([
    (process.env.NODE_ENV !== 'test') ? knex.schema.createSchemaIfNotExists('auth') : null,
    knex.schema.withSchema('auth').hasTable('auth').then((exists) => {
      if (!exists) {
        return knex.schema.createTable('auth', (table) => {
          table.uuid('id').notNullable().primary()
          table.string('email').notNullable().unique()
          table.boolean('verified').notNullable().defaultTo(false)
          table.string('password').nullable()
          table.string('salt').nullable()
          table.string('reset_token').defaultTo(null)
          table.string('stripe_customer_id').nullable().defaultTo(null)
          table.boolean('deleted').notNullable().defaultTo(false)
          table.dateTime('created_at', { useTz: true }).notNullable()
          table.dateTime('updated_at', { useTz: true }).notNullable()
        })
      }
    })
  ])
}

export function down(knex: Knex): Promise<any> {
  return knex.schema.withSchema('auth').dropTableIfExists('auth')
}
