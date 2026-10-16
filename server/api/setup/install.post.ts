import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { SetupService } from '../../services/setupService'

const schema = z.object({
  company: z.object({
    name: z.string().min(2, 'El nombre de la empresa es obligatorio'),
    taxId: z.string().optional(),
    logo: z.string().optional(),
    timezone: z.string().default('America/Caracas')
  }),
  branch: z.object({
    code: z.string().min(2, 'El código de la sede es obligatorio').toUpperCase(),
    name: z.string().min(2, 'El nombre de la sede es obligatorio'),
    description: z.string().optional()
  }),
  admin: z.object({
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    name: z.string().min(2, 'El nombre del administrador es obligatorio'),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
  })
})

export default defineApiHandler(async (event) => {
  const body = await readBody(event)
  const valid = schema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return SetupService.install(valid as any, ip)
})
