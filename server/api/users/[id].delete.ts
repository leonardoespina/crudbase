import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { UserService } from '../../services/userService'

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'USERS', 'delete')
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return UserService.delete(id, actor, ip)
})
