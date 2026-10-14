import { z } from 'zod'
import { AuthService } from '../../services/authService'
import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'

const schema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
})

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return AuthService.changePassword(auth.userId, valid.currentPassword, valid.newPassword, ip)
})
