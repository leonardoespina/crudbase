import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { ServicioCargos } from '../../services/servicioCargos'

export default defineApiHandler(async (event) => {
  const actor = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  return ServicioCargos.eliminar(id, actor.userId, ip)
})
