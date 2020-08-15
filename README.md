# oAuth

The credential and authorization API service for oauth token flow and credential management.

## Pre-requisites

The project requires the following highly-available services to be running:

  * [PostgreSQL](https://www.postgresql.org/)
  * [Google Cloud Pub/Sub](https://cloud.google.com/pubsub)

You can inject the configuration for access to these services as environment variables.

## Quickstart

#### Local development

Local development uses a local postgresql database and google cloud sdk image for google pubsub. The default config
values will enable the services to speak to one another

```
export project_path=/path/to/project
cd $project_path
npm i
docker-compose up -d
npm start # You only need to run npm start if you do not have oauth running as a docker-compose service.
```

## Environment variables

The following environment variables allow you to inject configuration into the oauth API at runtime.

#### App configuration
  * `APP_NAME`
    The name of this instance of the API.
  * `APP_PORT`
    The port to bind the API to listen to requests on.
  * `APP_CORS`
    The configuration to pass the CORS middleware as a JSON string. See [@koa/cors](https://github.com/koajs/cors) for the full configuration options.
  * `LOG_LEVEL`
    The log level to set for the log output. See [Pino](https://github.com/pinojs/pino)

#### Database configuration
  * `DB_CLIENT`
    The database client. You can use `sqlite3` for running tests or local development. Default is `pg` (postgresql).
  * `DB_CONNECTION_TIMEOUT`
    The database connection timeout in milliseconds. Default is `10000` (10 seconds).
  * `DB_CONNECTION_HOST`
    The database connection host DNS or IP including port, if necessary. Default is `localhost`.
  * `DB_CONNECTION_USER`
    The database connection user. Default is `oauth`.
  * `DB_CONNECTION_PASSWORD`
    The database connection password. Default is `root`.
  * `DB_CONNECTION_DATABASE`
    The database to connect to with. Default is `oauth`.
  * `DB_POOL_MIN`
    The minimum size of the database connection pool. Default is `0`.
  * `DB_POOL_MAX`
    The maximum size of the database connection pool. Default is `2`.
  * `DB_MIGRATIONS_DIR`
    The directory path to where migrations files are located. Default is `/src/database/migs`.
  * `DB_MIGRATIONS_EXT`
    The extension to apply when creating new migration files. Default is `.ts`, `.js`.
  * `DB_MIGRATIONS_TABLE`
    The name of the table for logging database migrations. Default is `knex_migs`.
  * `DB_MIGRATIONS_LOAD_EXTS`
    The map of extensions to match when loading migrations for the migrations directory. Default is `.ts` and `.js`.
  * `DB_SEEDS_DIR`
    The directory path to where seed files are located. Default is `/src/database/seeds`.

#### Google Cloud Pub/Sub configuration
  * `PUBSUB_TOPIC`
    The name of the topic to publish password reset email pubsub messages to. Default is `mailer.send`
  * `PUBSUB_OPTS`
    The client config to apply to the pubsub client. See [PubSub ClientConfig](https://googleapis.dev/nodejs/pubsub/latest/global.html#ClientConfig) for full config options. Defaults to `{ "projectId": "project-id", "apiEndpoint": "localhost:8085" }`

#### Google oAuth
  * `GOOGLE_CLIENT_ID`
    Your Google oAuth client ID.
  * `GOOGLE_CLIENT_SECRET`
    Your Google oAuth client secret.

#### Facebook oAuth
  * `FACEBOOK_API_VERSION`
    The API version to perform requests against. Defaults to `v7.0`.
  * `FACEBOOK_APP_ID`
    Your Facebook app ID.
  * `FACEBOOK_APP_SECRET`
    Your Facebook app secret.
  * `FACEBOOK_APP_TOKEN`
    Your Facebook app token.

#### Crypto
  * `CRYPTO_SECRET`
    The secret to use to encrypt stored passwords. Defaults to `pacopaco`.

#### JWT SECRET
  * `JWT_SECRET`
    The secret to use to sign access tokens with. Defaults to `pacopaco`.
  * `JWT_DURATION_SECS`
    The duration in seconds until access tokens expire. Defaults to `86400`.
  * `JWT_REFRESH_DURATION_SECS`
    The duration in seconds until refresh tokens expire. Defaults to `3600`.
  * `JWT_RESET_DURATION_SECS`
    The duration in seconds until reset token tokens expire. Defaults to `3600`.
  * `COOKIE_KEYS`
    The map of keys to sign cookies with. Defaults to `paco` and `pacopaco`.
  * `COOKIE_OPTS`
    The options to pass when setting cookies on responses and reading cookies on requests. Defaults to `{ "signed": true, "path": "/", "httpOnly": true, "secure": false, "overwrite": true, "sameSite": true }`

## Running tests

```
cp config/test.example.yml config/test.yml
## Ensure you add working credentials for Google and Facebook OAuth to the config/test.yml configuration
docker-compose up -d
npm t
```