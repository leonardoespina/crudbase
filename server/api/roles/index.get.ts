import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { RoleService } from '../../services/roleService'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'ROLES', 'read')
  return RoleService.list()
})
