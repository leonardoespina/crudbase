import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { RoleService } from '../../services/roleService'

export default defineApiHandler(async (event) => {
  await requireAuth(event)
  return RoleService.listModules()
})
