import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { UserService } from '../../services/userService'

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  roleId: z.number().optional(),
  branchId: z.number().nullable().optional(),
  active: z.boolean().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'USERS', 'update')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return UserService.update(id, valid, actor, ip)
})
