import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { ServicioGerencias } from '../../services/servicioGerencias'

const esquema = z.object({
  codigo: z.string().min(1).optional(),
  nombre: z.string().min(2).optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const valid = esquema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioGerencias.actualizar(id, valid, actor.userId, ip)
})
