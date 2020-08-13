import log from 'pino'
import config from './config'

export default new log({ name: config.app.name, level: config.log.level })