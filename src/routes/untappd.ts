import { route } from '@kodasoftware/koa-bundle'
import confirmUntappd from '../middleware/confirm-untappd'
import getUntappdToken from '../middleware/get-untappd-token'

const router = route('getUntappdToken', 'get', '/', [getUntappdToken])
route('getUntappdToken', 'get', '/confirm', [confirmUntappd], { router })

export default router
