import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { BranchService } from '../../services/branchService'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'BRANCHES', 'read')
  const query = getQuery(event)
  const includeInactive = query.includeInactive === 'true'

  return BranchService.list(includeInactive)
})
