import { route } from '@kodasoftware/koa-bundle'
import ping from '../middleware/ping'

const router = route('ping', 'get', '/', [ping])

export default router
