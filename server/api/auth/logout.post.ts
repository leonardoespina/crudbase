import { AuthService } from '../../services/authService'
import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'

export default defineApiHandler(async (event) => {
  const auth = await requireAuth(event)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  await AuthService.logout(auth.userId, ip)

  // Eliminar cookie
  deleteCookie(event, 'auth_token', { path: '/' })

  return { success: true }
})
