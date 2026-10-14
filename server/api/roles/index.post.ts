import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { RoleService } from '../../services/roleService'
import { withIdempotency } from '../../utils/idempotency'

const permissionItemSchema = z.object({
  moduleId: z.number(),
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean()
})

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').toUpperCase(),
  description: z.string().optional(),
  permissions: z.array(permissionItemSchema).optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'ROLES', 'create')
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return withIdempotency(event, () =>
    RoleService.create(valid, actor.id, ip)
  )
})
