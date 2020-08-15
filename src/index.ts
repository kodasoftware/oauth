import App from './app'
import logger from './logger'

async function main(): Promise<void> {
  const app = new App()
  try {
    await app.start()
  } catch (err) {
    logger.error(err)
    app.close()
  }
}

main().then()
