import * as Knex from 'knex'


export async function up(knex: Knex): Promise<any> {
  await knex.schema.table('auth', table => {
    table.integer('invite_tokens').notNullable()
  })
  const exists = await knex.schema.hasTable('invitee')
  if (!exists) {
    await knex.schema.createTable('invitee', table => {
      table.string('email').notNullable().primary()
      table.uuid('inviter_id').notNullable()
      table.string('token').notNullable().unique()
      table.boolean('active').notNullable().defaultTo(true)
      table.dateTime('created_at', { useTz: true }).notNullable()
      table.dateTime('updated_at', { useTz: true }).notNullable()
      table.unique(['inviter_id', 'email'])
    })
  }
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTableIfExists('invitee')
  await knex.schema.table('auth', table => {
    table.dropColumn('invite_tokens')
  })
}
