import cfg from './src/config';

module.exports = {
  client: cfg.database.client || 'pg',
  connection: cfg.database.connection,
  pool: {
    min: parseInt(cfg.database.pool.min, 10),
    max: parseInt(cfg.database.pool.max, 10),
  },
  acquireConnectionTimeout: cfg.database.connectionTimeout,
  migrations: cfg.database.migrations,
  seeds: cfg.database.seeds,
  useNullAsDefault: process.env.NODE_ENV === 'test'
}
