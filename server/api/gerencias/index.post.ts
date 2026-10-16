import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { ServicioGerencias } from '../../services/servicioGerencias'

const esquema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requireAuth(event)
  const body = await readBody(event)
  const valid = esquema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioGerencias.crear(valid, actor.userId, ip)
})
