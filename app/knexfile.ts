import cfg from './src/config';

module.exports = {
  client: cfg.database.client || 'pg',
  connection: cfg.database.connection,
  pool: cfg.database.pool,
  acquireConnectionTimeout: cfg.database.connectionTimeout,
  migrations: cfg.database.migrations,
  seeds: cfg.database.seeds,
  useNullAsDefault: process.env.NODE_ENV === 'test'
}
