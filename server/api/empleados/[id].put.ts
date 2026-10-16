import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { getUserContext } from '../../utils/auth'
import { ServicioEmpleados } from '../../services/servicioEmpleados'

const esquema = z.object({
  cedula: z.string().min(4).optional(),
  nombres: z.string().min(2).optional(),
  apellidos: z.string().min(2).optional(),
  correo: z.string().email().optional().nullable().or(z.literal('')),
  telefono: z.string().optional().nullable(),
  sedeId: z.number().int().positive().optional(),
  gerenciaId: z.number().int().positive().optional(),
  cargoId: z.number().int().positive().optional(),
  nivelSalarialId: z.number().int().positive().optional().nullable(),
  activo: z.boolean().optional()
})

export default defineApiHandler(async (event) => {
  const actor = await getUserContext(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const valid = esquema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioEmpleados.actualizar(id, {
    ...valid,
    correo: valid.correo || undefined,
    telefono: valid.telefono || undefined
  }, actor, ip)
})
