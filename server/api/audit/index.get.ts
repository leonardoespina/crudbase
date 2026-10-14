import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { AuditService } from '../../services/auditService'

export default defineApiHandler(async (event) => {
  await requirePermission(event, 'AUDIT', 'read')
  const query = getQuery(event)
  const limit = query.limit ? Number(query.limit) : 100
  const entity = query.entity ? String(query.entity) : undefined

  return AuditService.list(limit, entity)
})
