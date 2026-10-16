import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { ServicioNivelesSalariales } from '../../services/servicioNivelesSalariales'

export default defineApiHandler(async (event) => {
  await requireAuth(event)
  return ServicioNivelesSalariales.listar()
})
