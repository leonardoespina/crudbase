import { z } from 'zod'
import { defineApiHandler } from '../../utils/handler'
import { getUserContext } from '../../utils/auth'
import { ServicioEmpleados } from '../../services/servicioEmpleados'

const esquema = z.object({
  cedula: z.string().min(4, 'La cédula debe tener al menos 4 caracteres'),
  nombres: z.string().min(2, 'Los nombres son requeridos'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  correo: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  sedeId: z.number().int().positive('La sede es requerida'),
  gerenciaId: z.number().int().positive('La gerencia es requerida'),
  cargoId: z.number().int().positive('El cargo es requerido'),
  nivelSalarialId: z.number().int().positive().optional().nullable()
})

export default defineApiHandler(async (event) => {
  const actor = await getUserContext(event)
  const body = await readBody(event)
  const valid = esquema.parse(body)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioEmpleados.crear({
    ...valid,
    correo: valid.correo || undefined,
    nivelSalarialId: valid.nivelSalarialId || undefined
  }, actor, ip)
})
