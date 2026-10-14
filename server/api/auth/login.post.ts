import { z } from 'zod'
import { AuthService } from '../../services/authService'
import { defineApiHandler } from '../../utils/handler'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export default defineApiHandler(async (event) => {
  const body = await readBody(event)
  const validData = loginSchema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const result = await AuthService.login(validData.username, validData.password, ip)

  const config = useRuntimeConfig()
  // Configuración de cookie segura o apta para LAN HTTP
  setCookie(event, 'auth_token', result.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 60 * 60 * 12, // 12 horas
    path: '/'
  })

  return result
})
