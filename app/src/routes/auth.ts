import { route } from '@kodasoftware/koa-bundle'

import createAuthMiddleware from '../middleware/create-auth'
import forgottenAuth from '../middleware/forgotten-auth'
import updateAuth from '../middleware/update-auth'
import deleteAuth from '../middleware/delete-auth'

const router = route('createAuth', 'post', '/', [createAuthMiddleware])
route('getForgottenAuth', 'get', '/', [forgottenAuth], { router })
route('updateAuth', 'put', '/', [updateAuth], { router })
route('deleteAuth', 'delete', '/', [deleteAuth], { router })

export default router
