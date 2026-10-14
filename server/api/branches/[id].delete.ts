import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { BranchService } from '../../services/branchService'

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'BRANCHES', 'delete')
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return BranchService.delete(id, actor.id, ip)
})
