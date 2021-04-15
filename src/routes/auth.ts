import { route } from '@kodasoftware/koa-bundle'

// import createAuthMiddleware from '../middleware/create-auth'
import createAuthFromInvite from '../middleware/create-auth-from-invite'
import forgottenAuth from '../middleware/forgotten-auth'
import updateAuth from '../middleware/update-auth'
import deleteAuth from '../middleware/delete-auth'
import sendInvite from '../middleware/send-invite'
import verifyInvite from '../middleware/verify-invite-token'

const router = route('createAuth', 'post', '/', [createAuthFromInvite])
route('getForgottenAuth', 'get', '/', [forgottenAuth], { router })
route('updateAuth', 'put', '/', [updateAuth], { router })
route('deleteAuth', 'delete', '/', [deleteAuth], { router })
route('inviteAuth', 'post', '/invites', [sendInvite], { router })
route('verifyInvite', 'get', '/invites', [verifyInvite], { router })

export default router
