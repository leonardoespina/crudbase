import { z } from 'zod'
import { defineApiHandler } from '../../../utils/handler'
import { getUserContext } from '../../../utils/auth'
import { ServicioEmpleados } from '../../../services/servicioEmpleados'

const esquema = z.object({
  bloquear: z.boolean(),
  motivo: z.string().min(3, 'El motivo debe tener al menos 3 caracteres')
})

export default defineApiHandler(async (event) => {
  const actor = await getUserContext(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const valid = esquema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioEmpleados.cambiarBloqueoPago(id, valid.bloquear, valid.motivo, actor, ip)
})
