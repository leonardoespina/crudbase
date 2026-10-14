import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { BranchService } from '../../services/branchService'
import { withIdempotency } from '../../utils/idempotency'

const schema = z.object({
  code: z.string().min(2, 'El código debe tener al menos 2 caracteres').toUpperCase(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  active: z.boolean().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'BRANCHES', 'create')
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return withIdempotency(event, () =>
    BranchService.create(valid, actor.id, ip)
  )
})
