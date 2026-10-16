import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Representación del modelo Empleado en el frontend
 */
export interface Empleado {
  id: number
  cedula: string
  nombres: string
  apellidos: string
  correo?: string | null
  telefono?: string | null
  sedeId: number
  gerenciaId: number
  cargoId: number
  nivelSalarialId?: number | null
  activo: boolean
  bloqueadoParaPago: boolean
  motivoBloqueo?: string | null
  sede?: { id: number; code: string; name: string }
  gerencia?: { id: number; codigo: string; nombre: string }
  cargo?: { id: number; codigo: string; nombre: string }
  nivelSalarial?: { id: number; codigo: string; nombre: string } | null
}

/**
 * Store Pinia: Gestión de Personal y Empleados
 *
 * Centraliza la comunicación HTTP con la API, el estado de la lista de trabajadores,
 * los catálogos auxiliares (gerencias, cargos, niveles, sedes) y las operaciones de
 * alta, edición, bloqueo preventivo y eliminación lógica.
 */
export const useEmpleadosStore = defineStore('empleados', () => {
  // Estado reactivo
  const empleados = ref<Empleado[]>([])
  const gerencias = ref<any[]>([])
  const cargos = ref<any[]>([])
  const nivelesSalariales = ref<any[]>([])
  const sedes = ref<any[]>([])
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

  /**
   * Carga en paralelo los catálogos auxiliares para poblar los selectores del formulario y filtros
   */
  async function fetchCatalogos() {
    try {
      const [resGerencias, resCargos, resNiveles, resSedes]: any[] = await Promise.all([
        $fetch('/api/gerencias?todos=true'),
        $fetch('/api/cargos?todos=true'),
        $fetch('/api/niveles-salariales'),
        $fetch('/api/branches')
      ])

      gerencias.value = resGerencias?.items || []
      cargos.value = resCargos?.items || []
      nivelesSalariales.value = resNiveles?.items || []
      sedes.value = resSedes?.items || resSedes || []
    } catch (error) {
      console.error('Error cargando catálogos de empleados:', error)
    }
  }

  /**
   * Consulta el listado de empleados en el servidor enviando los filtros activos y paginación
   */
  async function fetchEmpleados(filtros: any = {}) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
      if (filtros.gerenciaId) params.append('gerenciaId', filtros.gerenciaId.toString())
      if (filtros.cargoId) params.append('cargoId', filtros.cargoId.toString())
      if (filtros.sedeId) params.append('sedeId', filtros.sedeId.toString())
      if (filtros.bloqueadoParaPago !== undefined && filtros.bloqueadoParaPago !== null) {
        params.append('bloqueadoParaPago', filtros.bloqueadoParaPago.toString())
      }
      params.append('page', (filtros.page || page.value).toString())
      params.append('limit', (filtros.limit || limit.value).toString())

      const res: any = await $fetch(`/api/empleados?${params.toString()}`)
      empleados.value = res.items || []
      total.value = res.meta?.total || 0
      page.value = res.meta?.page || 1
      limit.value = res.meta?.limit || 20
    } finally {
      loading.value = false
    }
  }

  /**
   * Envía la solicitud de creación de un nuevo empleado al backend
   */
  async function crearEmpleado(datos: any) {
    const nuevo = await $fetch('/api/empleados', {
      method: 'POST',
      body: datos
    })
    await fetchEmpleados()
    return nuevo
  }

  /**
   * Envía la actualización de un empleado existente
   */
  async function actualizarEmpleado(id: number, datos: any) {
    const actualizado = await $fetch(`/api/empleados/${id}`, {
      method: 'PUT',
      body: datos
    })
    await fetchEmpleados()
    return actualizado
  }

  /**
   * Ejecuta la acción de bloqueo o desbloqueo preventivo de pagos en caja
   *
   * @param id Identificador del empleado
   * @param bloquear `true` para bloquear pagos, `false` para desbloquear
   * @param motivo Justificación obligatoria requerida por auditoría
   */
  async function cambiarBloqueo(id: number, bloquear: boolean, motivo: string) {
    const res = await $fetch(`/api/empleados/${id}/bloqueo`, {
      method: 'PUT',
      body: { bloquear, motivo }
    })
    await fetchEmpleados()
    return res
  }

  /**
   * Ejecuta la eliminación lógica (Soft Delete) de un empleado
   */
  async function eliminarEmpleado(id: number) {
    await $fetch(`/api/empleados/${id}`, {
      method: 'DELETE'
    })
    await fetchEmpleados()
  }

  return {
    empleados,
    gerencias,
    cargos,
    nivelesSalariales,
    sedes,
    loading,
    total,
    page,
    limit,
    fetchCatalogos,
    fetchEmpleados,
    crearEmpleado,
    actualizarEmpleado,
    cambiarBloqueo,
    eliminarEmpleado
  }
})
