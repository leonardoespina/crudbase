import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requirePermission } from '../../utils/auth'
import { UserService } from '../../services/userService'
import { withIdempotency } from '../../utils/idempotency'

const schema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  name: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  roleId: z.number({ required_error: 'El rol es obligatorio' }),
  branchId: z.number().nullable().optional(),
  active: z.boolean().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requirePermission(event, 'USERS', 'create')
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return withIdempotency(event, () =>
    UserService.create(valid, actor, ip)
  )
})
