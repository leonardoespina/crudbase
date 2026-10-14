import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { BranchService } from '../../services/branchService'

const schema = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  active: z.boolean().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'BRANCHES', 'update')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return BranchService.update(id, valid, actor.id, ip)
})
