import { defineApiHandler } from '../../utils/handler'
import { getUserContext } from '../../utils/auth'
import { ServicioEmpleados } from '../../services/servicioEmpleados'

export default defineApiHandler(async (event) => {
  const actor = await getUserContext(event)
  const query = getQuery(event)

  return ServicioEmpleados.listar({
    busqueda: query.busqueda as string,
    sedeId: query.sedeId ? Number(query.sedeId) : undefined,
    gerenciaId: query.gerenciaId ? Number(query.gerenciaId) : undefined,
    cargoId: query.cargoId ? Number(query.cargoId) : undefined,
    bloqueadoParaPago: query.bloqueadoParaPago !== undefined ? query.bloqueadoParaPago === 'true' : undefined,
    activo: query.activo !== undefined ? query.activo === 'true' : undefined,
    pagina: Number(query.page || query.pagina) || 1,
    limite: Number(query.limit || query.limite) || 50,
    todos: query.todos === 'true'
  }, actor)
})
