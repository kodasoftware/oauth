import { route } from '@kodasoftware/koa-bundle'
import getToken from '../middleware/get-token'
import refreshTokenMiddleware from '../middleware/refresh-token'

const router = route('getToken', 'post', '/', [getToken])
route('refreshToken', 'get', '/', [refreshTokenMiddleware], { router })

export default router
