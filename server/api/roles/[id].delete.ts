import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { RoleService } from '../../services/roleService'

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'ROLES', 'delete')
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return RoleService.delete(id, actor.id, ip)
})
