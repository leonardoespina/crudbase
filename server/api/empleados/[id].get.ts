import { defineApiHandler } from '../../utils/handler'
import { getUserContext } from '../../utils/auth'
import { ServicioEmpleados } from '../../services/servicioEmpleados'

export default defineApiHandler(async (event) => {
  const actor = await getUserContext(event)
  const id = Number(getRouterParam(event, 'id'))

  return ServicioEmpleados.obtenerPorId(id, actor)
})
