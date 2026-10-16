import { defineApiHandler } from '../../utils/handler'
import { getUserContext } from '../../utils/auth'
import { ServicioEmpleados } from '../../services/servicioEmpleados'

export default defineApiHandler(async (event) => {
  const actor = await getUserContext(event)
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioEmpleados.eliminar(id, actor, ip)
})
