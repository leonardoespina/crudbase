import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { UserService } from '../../services/userService'

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'USERS', 'read')
  return UserService.list(actor)
})
