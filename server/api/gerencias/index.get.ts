import { defineApiHandler } from '../../utils/handler'
import { requireAuth } from '../../utils/auth'
import { ServicioGerencias } from '../../services/servicioGerencias'

export default defineApiHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)

  return ServicioGerencias.listar({
    busqueda: query.busqueda as string,
    activo: query.activo !== undefined ? query.activo === 'true' : undefined,
    pagina: Number(query.page || query.pagina) || 1,
    limite: Number(query.limit || query.limite) || 50,
    todos: query.todos === 'true'
  })
})
