import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { ServicioGerencias } from '../../services/servicioGerencias'

export default defineApiHandler(async (event) => {
  const actor = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioGerencias.eliminar(id, actor.userId, ip)
})
